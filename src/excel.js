import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const workbook = new ExcelJS.Workbook();
let filename

async function InitializeExcel() {
    const ExportButton = document.getElementById('export')
    ExportButton.onclick = ExportExcel

    filename = getFormattedDate()
   
    const sheet = workbook.addWorksheet('Sheet');
    sheet.columns = [
        { header: 'Generation', key: 'data1', width: 10 },
        { header: 'Distance', key: 'data2', width: 10 },
    ];
}

async function AppendToExcel(data1, data2) {

    // Get the first worksheet
    const worksheet = workbook.getWorksheet('Sheet');

    // Add a row at the end of the sheet
    worksheet.addRow({ data1: data1, data2: data2 });
}

async function ExportExcel() {

    const buffer = await workbook.xlsx.writeBuffer();
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const fileExtension = '.xlsx';
    
    const blob = new Blob([buffer], {type: fileType});
    
    saveAs(blob, filename + fileExtension);
}

function getFormattedDate() {
    var date = new Date();

    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;
    sec = (sec < 10 ? "0" : "") + sec;

    var str = date.getFullYear() + "_" + month + "_" + day + "_" +  hour + "_" + min + "_" + sec;

    /*alert(str);*/

    return str;
}


module.exports = {AppendToExcel, InitializeExcel}