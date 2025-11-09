import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { environment } from '@environments/environments.local';

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  message?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  key: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class S3UploadService {
  private http = inject(HttpClient);

  private readonly ALLOWED_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/pdf', // .pdf
    'image/jpeg', // .jpg
    'image/png', // .png
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  /**
   * Valida si el archivo es permitido
   */
  isFileValid(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No se ha seleccionado ningún archivo' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `El archivo excede el tamaño máximo de ${this.MAX_FILE_SIZE / 1024 / 1024} MB` 
      };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Tipo de archivo no permitido. Solo se permiten: xlsx, xls, csv, pdf, jpg, png' 
      };
    }

    return { valid: true };
  }

  /**
   * Obtiene URL pre-firmada del backend
   */
  private getPresignedUrl(fileName: string, contentType: string): Observable<PresignedUrlResponse> {
    const url = `${environment.apiUrl}/uploads/presigned-url`;
    return this.http.post<PresignedUrlResponse>(url, {
      fileName,
      contentType
    });
  }

  /**
   * Sube el archivo directamente a S3 usando la URL pre-firmada
   */
  private uploadToS3(file: File, presignedUrl: string): Observable<UploadResult> {
    const headers = new HttpHeaders({
      'Content-Type': file.type
    });

    return from(
      fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })
    ).pipe(
      map(response => {
        if (response.ok) {
          return { success: true, key: '' };
        } else {
          throw new Error(`Error al subir archivo: ${response.statusText}`);
        }
      }),
      catchError(error => {
        console.error('Error uploading to S3:', error);
        return throwError(() => new Error('Error al subir el archivo a S3'));
      })
    );
  }

  /**
   * Método principal para subir archivos
   * 1. Valida el archivo
   * 2. Obtiene URL pre-firmada del backend
   * 3. Sube el archivo a S3
   */
  uploadFile(file: File): Observable<UploadResult> {
    // Validar archivo
    const validation = this.isFileValid(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error));
    }

    // Obtener URL pre-firmada y subir a S3
    return this.getPresignedUrl(file.name, file.type).pipe(
      switchMap(response => {
        return this.uploadToS3(file, response.uploadUrl).pipe(
          map(result => ({
            ...result,
            key: response.key
          }))
        );
      }),
      catchError(error => {
        console.error('Error in upload process:', error);
        return throwError(() => new Error(
          error.message || 'Error al procesar la subida del archivo'
        ));
      })
    );
  }

  /**
   * Método para subir archivo con seguimiento de progreso (opcional)
   * Nota: El progreso solo funciona con XMLHttpRequest, no con fetch
   */
  uploadFileWithProgress(
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Observable<UploadResult> {
    const validation = this.isFileValid(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error));
    }

    return this.getPresignedUrl(file.name, file.type).pipe(
      switchMap(response => {
        return new Observable<UploadResult>(observer => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
              onProgress({
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100)
              });
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              observer.next({
                success: true,
                key: response.key
              });
              observer.complete();
            } else {
              observer.error(new Error(`Error al subir archivo: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            observer.error(new Error('Error de red al subir el archivo'));
          });

          xhr.open('PUT', response.uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });
      }),
      catchError(error => {
        console.error('Error in upload with progress:', error);
        return throwError(() => new Error(
          error.message || 'Error al procesar la subida del archivo'
        ));
      })
    );
  }

  /**
   * Obtiene URL de descarga para un archivo
   */
  getDownloadUrl(key: string): Observable<{ downloadUrl: string }> {
    const url = `${environment.apiUrl}/uploads/download/${encodeURIComponent(key)}`;
    return this.http.get<{ downloadUrl: string }>(url);
  }
}

