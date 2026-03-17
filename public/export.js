(function() {
  function tableToArray() {
    var table = document.getElementById('financeTable');
    if (!table) return [];
    var rows = [];
    var trs = table.querySelectorAll('tr');
    for (var i = 0; i < trs.length; i++) {
      var cells = trs[i].querySelectorAll('th, td');
      var row = [];
      for (var j = 0; j < cells.length; j++) row.push((cells[j].textContent || '').trim().replace(/\s+/g, ' '));
      rows.push(row);
    }
    return rows;
  }

  function downloadBlob(blob, filename) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  document.getElementById('btnExportCsv').addEventListener('click', function() {
    var rows = tableToArray();
    var csv = rows.map(function(row) {
      return row.map(function(cell) {
        var s = String(cell);
        if (/[",;\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(';');
    }).join('\r\n');
    var BOM = '\uFEFF';
    downloadBlob(new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' }), 'finmodel-2026.csv');
  });

  document.getElementById('btnExportExcel').addEventListener('click', function() {
    var rows = tableToArray();
    if (typeof XLSX === 'undefined') {
      alert('Библиотека Excel не загружена.');
      return;
    }
    var ws = XLSX.utils.aoa_to_sheet(rows);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'План 2026');
    XLSX.writeFile(wb, 'finmodel-2026.xlsx');
  });

  document.getElementById('btnPrint').addEventListener('click', function() {
    window.print();
  });
})();
