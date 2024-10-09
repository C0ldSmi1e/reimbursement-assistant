const craftFilename = ({
  date,
  item,
  amount,
  mimeType,
}: {
  date: string;
  item: string;
  amount: string;
  mimeType: string;
}) => {
  const parts = [];
  if (date) {
    parts.push(date.replace(/\D/g, '_'));
  }
  if (item) {
    parts.push(item.replace(/\W/g, '_'));
  }
  if (amount) {
    parts.push(amount.replace(/\D/g, '_'));
  }
  const extension = mimeType.split('/')[1];
  const filename = parts.join('+') + `.${extension}`;
  return filename;
};

const findOrCreateFolder = async (driveClient, folderName: string) => {
  console.log(`Searching for folder: ${folderName}`);

  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  try {
    const response = await driveClient.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log(`Folder "${folderName}" found. ID: ${response.data.files[0].id}`);
      return response.data.files[0].id;
    }

    // If folder not found, create a new one
    console.log(`Folder "${folderName}" not found. Creating a new folder.`);

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await driveClient.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    console.log(`New folder created. Name: ${folderName}, ID: ${folder.data.id}`);
    return folder.data.id;
  } catch (error) {
    console.error('Error finding or creating folder:', error);
    throw error;
  }
}

export { craftFilename, findOrCreateFolder };