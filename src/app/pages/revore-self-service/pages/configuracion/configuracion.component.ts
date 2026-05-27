import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelfServiceService } from '@revore/services/self-service.service';
import {
    DbDesarrollador, DbProyecto, MetaWithRelations, GoalType, GOAL_TYPES,
} from '@revore/models/database.types';

@Component({
    selector: 'app-revore-configuracion',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './configuracion.component.html',
    styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent implements OnInit {

    isLoading = true;

    /** Sub-sección activa dentro de Configuración. 'none' muestra el selector. */
    selectedConfig: 'none' | 'metas' = 'none';

    // Metas
    desarrolladores: DbDesarrollador[] = [];
    proyectos: DbProyecto[] = [];
    proyectosFiltrados: DbProyecto[] = [];
    metas: MetaWithRelations[] = [];
    metasLoading = false;
    selectedMetaDesarrolladorId = '';
    selectedMetaProyectoId = '';

    showMetaModal = false;
    isEditingMeta = false;
    editingMetaId: string | null = null;
    isSavingMeta = false;
    metaError = '';
    confirmDeleteMetaId: string | null = null;
    metaForm!: FormGroup;

    readonly GOAL_TYPES = GOAL_TYPES;

    constructor(private svc: SelfServiceService, private fb: FormBuilder) {}

    async ngOnInit(): Promise<void> {
        const [desarrolladores, proyectos, metas] = await Promise.all([
            this.svc.getDesarrolladores(),
            this.svc.getProyectos(),
            this.svc.getMetas(),
        ]);
        this.desarrolladores = desarrolladores;
        this.proyectos = proyectos;
        this.metas = metas;
        this.isLoading = false;
        this.buildForms();
    }

    private buildForms(): void {
        this.metaForm = this.fb.group({
            desarrollador_id: ['', Validators.required],
            Proyecto_id:      ['', Validators.required],
            goal_type:        ['Digital' as GoalType, Validators.required],
            period:           [this.currentPeriod(), Validators.required],
            Inversion:        [0, [Validators.min(0)]],
            Leads:            [0, [Validators.required, Validators.min(0)]],
            Visitas:          [0, [Validators.required, Validators.min(0)]],
            Apartados:        [0, [Validators.required, Validators.min(0)]],
            Ventas:           [0, [Validators.required, Validators.min(0)]],
        });
    }

    /** Primer día del mes actual en formato YYYY-MM-DD (el CHECK de la tabla lo exige). */
    private currentPeriod(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    proyectoNombre(id: string): string {
        return this.proyectos.find(p => p.id === id)?.Nombre ?? '—';
    }

    desarrolladorNombre(id: string): string {
        return this.desarrolladores.find(d => d.id === id)?.Desarrollador ?? '—';
    }

    desarrolladorDeProyecto(proyectoId: string): string {
        const p = this.proyectos.find(x => x.id === proyectoId);
        return p ? this.desarrolladorNombre(p.Desarrollador_id) : '—';
    }

    /** Etiqueta legible para mes (ej. "Mayo 2026"). Espera ISO YYYY-MM-DD. */
    periodLabel(iso: string): string {
        if (!iso) return '—';
        const [y, m] = iso.split('-');
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        return `${meses[Number(m) - 1]} ${y}`;
    }

    async onMetaDesarrolladorFilter(id: string): Promise<void> {
        this.selectedMetaDesarrolladorId = id;
        this.selectedMetaProyectoId = '';
        await this.reloadMetas();
    }

    async onMetaProyectoFilter(id: string): Promise<void> {
        this.selectedMetaProyectoId = id;
        await this.reloadMetas();
    }

    private async reloadMetas(): Promise<void> {
        this.metasLoading = true;
        this.metas = await this.svc.getMetas({
            desarrolladorId: this.selectedMetaDesarrolladorId || undefined,
            proyectoId:      this.selectedMetaProyectoId || undefined,
        });
        this.metasLoading = false;
    }

    proyectosDelFiltro(): DbProyecto[] {
        if (!this.selectedMetaDesarrolladorId) return this.proyectos;
        return this.proyectos.filter(p => p.Desarrollador_id === this.selectedMetaDesarrolladorId);
    }

    onMetaDesarrolladorChangeInForm(desarrolladorId: string): void {
        this.metaForm.patchValue({ desarrollador_id: desarrolladorId, Proyecto_id: '' });
        this.proyectosFiltrados = this.proyectos.filter(p => p.Desarrollador_id === desarrolladorId);
    }

    openCreateMeta(): void {
        this.isEditingMeta = false;
        this.editingMetaId = null;
        this.metaError = '';
        this.proyectosFiltrados = [];
        this.metaForm.reset({
            desarrollador_id: '',
            Proyecto_id: '',
            goal_type: 'Digital',
            period: this.currentPeriod(),
            Inversion: 0, Leads: 0, Visitas: 0, Apartados: 0, Ventas: 0,
        });
        this.showMetaModal = true;
    }

    openEditMeta(m: MetaWithRelations): void {
        this.isEditingMeta = true;
        this.editingMetaId = m.id;
        this.metaError = '';
        const proyecto = this.proyectos.find(p => p.id === m.Proyecto_id);
        const desarrolladorId = proyecto?.Desarrollador_id ?? '';
        this.proyectosFiltrados = this.proyectos.filter(p => p.Desarrollador_id === desarrolladorId);
        this.metaForm.patchValue({
            desarrollador_id: desarrolladorId,
            Proyecto_id:      m.Proyecto_id,
            goal_type:        m.goal_type,
            period:           m.period,
            Inversion:        m.details?.Inversion ?? 0,
            Leads:            m.details?.Leads ?? 0,
            Visitas:          m.details?.Visitas ?? 0,
            Apartados:        m.details?.Apartados ?? 0,
            Ventas:           m.details?.Ventas ?? 0,
        });
        this.showMetaModal = true;
    }

    closeMetaModal(): void {
        this.showMetaModal = false;
        this.metaError = '';
    }

    /** Normaliza al primer día del mes (el CHECK de la tabla lo exige). */
    private normalizePeriod(period: string): string {
        if (!period) return this.currentPeriod();
        const [y, m] = period.split('-');
        return `${y}-${String(m).padStart(2, '0')}-01`;
    }

    async saveMeta(): Promise<void> {
        if (this.metaForm.invalid) return;
        this.isSavingMeta = true;
        this.metaError = '';
        const v = this.metaForm.value;

        const details: Record<string, number> = {
            Leads:     Number(v.Leads),
            Visitas:   Number(v.Visitas),
            Apartados: Number(v.Apartados),
            Ventas:    Number(v.Ventas),
        };
        if (v.goal_type !== 'General') {
            details['Inversion'] = Number(v.Inversion ?? 0);
        }

        const payload = {
            Proyecto_id: v.Proyecto_id,
            goal_type:   v.goal_type as GoalType,
            period:      this.normalizePeriod(v.period),
            details:     details as any,
        };

        const { error } = this.isEditingMeta && this.editingMetaId
            ? await this.svc.updateMeta(this.editingMetaId, payload)
            : await this.svc.createMeta(payload);

        if (error) {
            this.metaError = error.message;
            this.isSavingMeta = false;
            return;
        }

        await this.reloadMetas();
        this.isSavingMeta = false;
        this.closeMetaModal();
    }

    requestDeleteMeta(id: string): void { this.confirmDeleteMetaId = id; }
    cancelDeleteMeta(): void { this.confirmDeleteMetaId = null; }

    async confirmDeleteMeta(): Promise<void> {
        if (!this.confirmDeleteMetaId) return;
        await this.svc.deleteMeta(this.confirmDeleteMetaId);
        this.metas = this.metas.filter(m => m.id !== this.confirmDeleteMetaId);
        this.confirmDeleteMetaId = null;
    }
}
