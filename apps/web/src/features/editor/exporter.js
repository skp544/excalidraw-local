import { exportToBlob, exportToSvg } from '@excalidraw/excalidraw';
import jsPDF from 'jspdf';
import { api } from '@/lib/api.js';

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Export and persist the current Excalidraw scene. The browser handles all
 * heavy lifting (rasterising / SVG / PDF) and we just stream the bytes back
 * to the API so the user can re-download the export later.
 */
export async function exportAndSave({ excalidrawApi, board, format = 'png' }) {
  const elements = excalidrawApi.getSceneElements();
  const appState = excalidrawApi.getAppState();
  const files = excalidrawApi.getFiles();
  const baseName = `${board.title.replace(/[^\w-]+/g, '-')}-${board.id.slice(-6)}`;

  if (format === 'png') {
    const blob = await exportToBlob({
      elements,
      appState: { ...appState, exportBackground: true },
      files,
      mimeType: 'image/png',
      quality: 1,
      exportPadding: 24,
    });
    const dataUrl = await blobToDataUrl(blob);
    triggerDownload(blob, `${baseName}.png`);
    await api.post('/export/save', {
      boardId: board.id,
      format: 'png',
      dataUrl,
      includeBackground: true,
      scale: 2,
    });
    return;
  }

  if (format === 'svg') {
    const svg = await exportToSvg({
      elements,
      appState,
      files,
      exportPadding: 24,
    });
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    triggerDownload(blob, `${baseName}.svg`);
    await api.post('/export/save', {
      boardId: board.id,
      format: 'svg',
      payload: xml,
      scale: 1,
    });
    return;
  }

  if (format === 'pdf') {
    const blob = await exportToBlob({
      elements,
      appState: { ...appState, exportBackground: true },
      files,
      mimeType: 'image/png',
      quality: 1,
      exportPadding: 24,
    });
    const dataUrl = await blobToDataUrl(blob);
    const img = new Image();
    img.src = dataUrl;
    await new Promise((r) => (img.onload = r));
    const pdf = new jsPDF({
      orientation: img.width >= img.height ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [img.width, img.height],
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
    pdf.save(`${baseName}.pdf`);
    const pdfBlob = pdf.output('blob');
    const pdfDataUrl = await blobToDataUrl(pdfBlob);
    await api.post('/export/save', {
      boardId: board.id,
      format: 'pdf',
      dataUrl: pdfDataUrl,
      scale: 2,
    });
    return;
  }

  if (format === 'json') {
    const { data } = await api.get(`/export/board/${board.id}/json`);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, `${baseName}.json`);
    await api.post('/export/save', {
      boardId: board.id,
      format: 'json',
      payload: json,
      scale: 1,
    });
  }
}

/**
 * Capture a small thumbnail of the current scene and upload it to the board.
 * Used after meaningful autosaves so the dashboard preview stays fresh.
 */
export async function captureThumbnail({ excalidrawApi, boardId }) {
  const elements = excalidrawApi.getSceneElements();
  if (!elements?.length) return null;
  const blob = await exportToBlob({
    elements,
    appState: { ...excalidrawApi.getAppState(), exportBackground: true },
    files: excalidrawApi.getFiles(),
    mimeType: 'image/webp',
    quality: 0.7,
    exportPadding: 24,
  });
  const dataUrl = await blobToDataUrl(blob);
  await api.post(`/boards/${boardId}/thumbnail`, { dataUrl });
  return dataUrl;
}
