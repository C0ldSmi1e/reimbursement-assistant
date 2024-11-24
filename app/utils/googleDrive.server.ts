import { drive_v3, sheets_v4 } from "googleapis";

const craftFilename = ({
  date,
  item,
  amount,
  mimeType,
  page,
}: {
  date: string;
  item: string;
  amount: string;
  mimeType: string;
  page: number;
}) => {
  const parts = [];
  if (date) {
    parts.push(date.replace(/\D/g, "_"));
  }
  if (item) {
    parts.push(item.replace(/\W/g, "_"));
  }
  if (amount) {
    parts.push(amount.replace(/\D/g, "_"));
  }
  if (page) {
    parts.push(page.toString());
  }
  const extension = mimeType.split("/")[1];
  const filename = parts.join("+") + `.${extension}`;
  return filename;
};

const findOrCreateFolder = async ({
  driveClient,
  folderName,
}: {
  driveClient: drive_v3.Drive;
  folderName: string;
}) => {
  console.log(`Searching for folder: ${folderName}`);

  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  try {
    const response = await driveClient.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log(`Folder "${folderName}" found. ID: ${response.data.files[0].id}`);
      return response.data.files[0].id;
    }

    // If folder not found, create a new one
    console.log(`Folder "${folderName}" not found. Creating a new folder.`);

    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await driveClient.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });

    console.log(`New folder created. Name: ${folderName}, ID: ${folder.data.id}`);
    return folder.data.id;
  } catch (error) {
    console.error("Error finding or creating folder:", error);
    throw error;
  }
};

const findOrCreateSheet = async ({
  driveClient,
  folderId,
  sheetName,
}: {
  driveClient: drive_v3.Drive;
  folderId: string;
  sheetName: string;
}) => {
  const response = await driveClient.files.list({
    q: `name = '${sheetName}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (response.data.files && response.data.files.length > 0) {
    console.log(`Sheet "${sheetName}" found. ID: ${response.data.files[0].id}`);
    return response.data.files[0].id;
  }

  console.log(`Sheet "${sheetName}" not found. Creating a new sheet.`);

  const fileMetadata = {
    name: sheetName,
    mimeType: "application/vnd.google-apps.spreadsheet",
    parents: [folderId],
  };

  const sheet = await driveClient.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });

  console.log(`New sheet created. Name: ${sheetName}, ID: ${sheet.data.id}`);

  return sheet.data.id;
};

const checkSheet = async ({
  sheetsClient,
  sheetId,
}: {
  sheetsClient: sheets_v4.Sheets;
  sheetId: string;
}) => {
  try {
    // Get the values from A1:C1
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A1:C1",
    });

    const values = response.data.values;

    // Check if the headers exist and are correct
    if (values && values.length > 0 &&
        values[0].length === 3 &&
        values[0][0] === "date" &&
        values[0][1] === "item" &&
        values[0][2] === "amount") {
      return { ok: true };
    }

    // If headers are missing or incorrect, add new headers
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "A1:C1",
      valueInputOption: "RAW",
      requestBody: {
        values: [["date", "item", "amount"]],
      },
    });

    console.log("Headers added or updated");
    return { ok: true };
  } catch (error) {
    console.error("Error checking or updating sheet:", error);
    throw error;
  }
};

const appendNewItemToSheet = async ({
  sheetsClient,
  sheetId,
  date,
  item,
  amount,
}: {
  sheetsClient: sheets_v4.Sheets;
  sheetId: string;
  date: string | undefined;
  item: string | undefined;
  amount: string | undefined;
}) => {
  try {
    // Get the current values in the sheet
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:C",
    });

    const values = response.data.values;
    
    // Find the first empty row
    const newRowIndex = values ? values.length + 1 : 2; // Start at row 2 if sheet is empty (after headers)

    // Append the new item
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:C",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[date || "", item || "", amount || ""]],
      },
    });

    console.log(`New item appended to row ${newRowIndex}`);
    return { success: true, rowIndex: newRowIndex };
  } catch (error) {
    console.error("Error appending new item to sheet:", error);
    throw error;
  }
};

export { craftFilename, findOrCreateFolder, findOrCreateSheet, checkSheet, appendNewItemToSheet };