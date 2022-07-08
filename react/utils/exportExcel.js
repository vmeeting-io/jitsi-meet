import moment from 'moment'
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

export default function exportExcel(csvData, filename){
  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  const fileExtension = '.xlsx';

  // console.log('Prepare exporting...');

  const ws = XLSX.utils.json_to_sheet(csvData);
  const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data_ex = new Blob([excelBuffer], {type: fileType});
  FileSaver.saveAs(data_ex, filename + "_" + moment().format('YYYY-MM-DD_HH-mm-ss') + fileExtension);
};
