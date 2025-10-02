export const downloadBlobUtil = (
  blob: Blob,
  fileName = 'file.txt'
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
      document.body.removeChild(link);
      resolve(true);
    } catch (error) {
      resolve(true);
    }
  });
};

export const downLoadFileFromUrl = (
  uri: string,
  name: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      window.open(uri, '_blank')
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
};
