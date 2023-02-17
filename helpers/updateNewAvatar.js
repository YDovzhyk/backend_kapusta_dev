const Jimp = require('jimp');
const fs = require("fs/promises");
const path = require("path");

const avatarsDir = path.join(__dirname, "../", "public", "avatars")

const updateNewAvatar = async (avatar, owner) => {
    const {path: tempUpload, originalname} = avatar;
    const filename = `${owner}_${originalname}`;
    const resultUpload = path.join(avatarsDir, filename);
    await fs.rename(tempUpload, resultUpload);

    const resizeAvatar = await Jimp.read(resultUpload);
    await resizeAvatar.resize(250, 250).write(resultUpload);

    return resultUpload;
};

const deleteNewAvatar = async (updatedAvatar) => {
    await fs.unlink(updatedAvatar, err => {
        if(err) throw err;
    });

}

module.exports = {updateNewAvatar, deleteNewAvatar};