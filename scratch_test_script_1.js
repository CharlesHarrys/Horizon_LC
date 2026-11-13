
    function descargarHTMLModificado() {
      document.body.contentEditable = 'false';
      const htmlCompleto = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
      const blob = new Blob([htmlCompleto], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'preview_configuracion_personalizado.html';
      a.click();
    }
  