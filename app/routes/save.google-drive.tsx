import { json, type ActionFunctionArgs } from "@remix-run/node";
import { google } from "googleapis";
import { getValidAccessToken } from "~/utils/googleAuth.server";
import {
  findOrCreateFolder,
  craftFilename,
  findOrCreateSheet,
  checkSheet,
  appendNewItemToSheet,
} from "~/utils/googleDrive.server";
import { getSession } from "~/utils/session.server";
import { ImageData } from "~/types";
import { Readable } from "stream";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const dataStr = formData.get("dataStr");

  const payload = dataStr ? JSON.parse(dataStr as string) : null;
  const {
    receiptData,
    receiptInfo,
  } = payload || {};

  const {
    date,
    item,
    amount,
  } = receiptInfo || {};

  try {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
      return json({ success: false, error: "User not found" });
    }

    const accessToken = await getValidAccessToken(request);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const driveClient = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    const sheetsClient = google.sheets({
      version: "v4",
      auth: oauth2Client,
    });

    const dateObj = new Date(date);
    const folderName =
      `reimbursement-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj.getFullYear()}`;
    const folderId = await findOrCreateFolder({ driveClient, folderName });
    if (!folderId) {
      return json({
        success: false,
        error: "Failed to find or create folder",
      });
    }

    const updateSheet = async () => {
      try {
        // Create or update the sheet
        const sheetName = `reimbursement-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj.getFullYear()}`;
        const sheetId = await findOrCreateSheet({ driveClient, folderId, sheetName });
    
        if (!sheetId) {
          return json({ success: false, error: "Failed to find or create sheet" });
        }
    
        await checkSheet({ sheetsClient, sheetId });
        await appendNewItemToSheet({ sheetsClient, sheetId, date, item, amount });

        return { success: true };
      } catch (error) {
        console.error("Error updating sheet:", error);
        return { success: false, error: "Failed to update sheet" };
      }
    };

    const imageResults = await Promise.all(receiptData.map(async (image: ImageData) => {
      const {
        base64,
        mimeType,
        page,
      } = image;

      const filename = craftFilename({
        date,
        item,
        amount,
        mimeType,
        page,
      });

      const fileMetadata = {
        name: filename,
        mimeType: mimeType,
        parents: [folderId],
      };

      // Convert base64 to buffer
      const buffer = Buffer.from(base64.split(",")[1], "base64");

      // Create a readable stream from the buffer
      const readable = new Readable();
      readable._read = () => {};
      readable.push(buffer);
      readable.push(null);

      const media = {
        mimeType: mimeType,
        body: readable,
      };

      const response = await driveClient.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id",
      });

      console.log("File uploaded successfully. File ID:", response.data.id);
      return { success: true, fileId: response.data.id };
    }));

    const sheetResult = await updateSheet() as { success: boolean };

    const success = imageResults.every((result) => result.success) && sheetResult.success;

    return json({ success });
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    return json({ success: false, error: "Failed to upload file" });
  }
}