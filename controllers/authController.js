const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");

const fs = require("fs");

const { Balance } = require("../models/balance");
const { User } = require("../models/user");
const { Session } = require("../models/session");
const { SECRET_KEY, REFRESH_SECRET_KEY } = process.env;

const { RequestError, updateNewAvatar, deleteNewAvatar } = require("../helpers");

const register = async (req, res) => {
  const { username, email, password, firstName } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw RequestError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);

  const newUser = await User.create({
    username,
    email,
    password: hashPassword,
    firstName,
    avatarURL,
  });

  const owner = newUser._id;

  await Balance.create({ owner });

  res.status(201).json({
    user: {
      firstName: newUser.name,
      email: newUser.email,
      newUser: newUser.newUser,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw RequestError(401, "Invalid email or password");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw RequestError(401, "Invalid email or password");
  }

  const paylaod = {
    id: user._id,
  };

  const accessToken = jwt.sign(paylaod, SECRET_KEY, { expiresIn: "8h" });
  const refreshToken = jwt.sign(paylaod, REFRESH_SECRET_KEY, { expiresIn: "24h" });
  
  const newSession = await Session.create({
    uid: user._id,
  });

    const result = await User.findByIdAndUpdate(
      user._id,
      { accessToken, refreshToken, sid: newSession.id, newUser: false },
      { new: true }
    );

  res.json(result);
};

const refreshAccesToken = async (req, res, next) => {
    const { authorization = "" } = req.headers;
    const [bearer, refreshToken] = authorization.split(" ");
    if (bearer !== "Bearer") {
      return res.status(401).send({ message: "No token provided" });
    } else {
      const activeSession = await Session.findById(req.body.sid);
      if (!activeSession) {
        return res.status(404).send({ message: "Invalid session" });
      }

      let payload = "";
      try {
        payload = jwt.verify(refreshToken, REFRESH_SECRET_KEY);
      } catch (error) {
          await Session.findByIdAndDelete(req.body.sid);
          return res.status(401).send({ message: "Unauthorized" });
      }

      const user = await User.findById(payload.id);
      const session = await Session.findById(req.body.sid);

      if (!user) {
        return res.status(404).send({ message: "Invalid user" });
      }
      if (!session) {
        return res.status(404).send({ message: "Invalid session" });
      }

      await Session.findByIdAndDelete(req.body.sid);

      const paylaod = {id: user._id,};
      const newSession = await Session.create({uid: user._id});
      const newAccessToken = jwt.sign(paylaod, SECRET_KEY, { expiresIn: "8h" });
      const newRefreshToken = jwt.sign(paylaod, REFRESH_SECRET_KEY, { expiresIn: "24" });

      const result = await User.findByIdAndUpdate(
        user._id,
        { accessToken: newAccessToken, refreshToken: newRefreshToken, sid: newSession._id},
        { new: true }
      );
    return res
      .status(200)
      .send(result);
    }
};

const logout = async (req, res) => {
  const { _id } = req.user;

  await User.findByIdAndUpdate(_id, { accessToken: "", refreshToken: "", sid: "" });
  await Session.findOneAndDelete({uid: _id});

  res.status(204).json({ message: "logout success" });
};

const googleSignup = async (req, res) => {
  const { email, sub, name, picture } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const owner = user.id;
    const paylaod = {
      id: owner,
    };

    const accessToken = jwt.sign(paylaod, SECRET_KEY, { expiresIn: "8h" });
    const refreshToken = jwt.sign(paylaod, REFRESH_SECRET_KEY, { expiresIn: "24" });

    const newSession = await Session.create({
      uid: user._id,
    });
  
      const result = await User.findByIdAndUpdate(
        user._id,
        { accessToken, refreshToken, sid: newSession.id, newUser: false },
        { new: true }
      );

    res.json(result);

  } else {
    const hashPassword = await bcrypt.hash(sub, 10);
    const avatarURL = picture;
    const newUser = await User.create({
      email,
      password: hashPassword,
      firstName: name,
      avatarURL,
    });

    const owner = newUser._id;
    await Balance.create({ owner });
    const paylaod = {
      id: owner,
    };
    const accessToken = jwt.sign(paylaod, SECRET_KEY, { expiresIn: "8h" });
    const refreshToken = jwt.sign(paylaod, REFRESH_SECRET_KEY, { expiresIn: "24h" });

    const newSession = await Session.create({
      uid: user._id,
    });
  
      const result = await User.findByIdAndUpdate(
        user._id,
        { accessToken, refreshToken, sid: newSession.id, newUser: false },
        { new: true }
      );

    res.json(result);
  }
};

const updateUserController = async (req, res) => {
  const { _id: owner } = req.user;
  const user = await User.findOne(owner);

  const { date, month, year, sex, email, firstName, lastName } = req.body;
  const avatar = req.file;

  if (avatar) {
    const updatedAvatar = await updateNewAvatar(avatar, owner);
    const img = fs.readFileSync(updatedAvatar, 'base64');
    const final_img = {
      contentType: req.file.mimetype,
      image: Buffer.from(img,'base64')
    };
    const avatarURL = 'data:image/png;base64,' + Buffer.from(final_img.image).toString('base64');
    const result = await User.findByIdAndUpdate(
      owner,
      {
        firstName: firstName ? firstName : user.firstName,
        lastName: lastName ? lastName : user.lastName,
        gender: sex ? sex : user.gender,
        dateBirth: date ? date : user.dateBirth,
        monthBirth: month ? month : user.monthBirth,
        yearBirth: year ? year : user.yearBirth,
        email: email ? email : user.email,
        avatarURL: avatarURL,
      },
      { new: true }
    );
    await deleteNewAvatar(updatedAvatar);
    res.status(200).json(result);
  } else {
    const result = await User.findByIdAndUpdate(
      owner,
      {
        firstName: firstName ? firstName : user.firstName,
        lastName: lastName ? lastName : user.lastName,
        gender: sex ? sex : user.gender,
        dateBirth: date ? date : user.dateBirth,
        monthBirth: month ? month : user.monthBirth,
        yearBirth: year ? year : user.yearBirth,
        email: email ? email : user.email,
      },
      { new: true }
    );
    res.status(200).json(result);
  }
};

const deleteUserController = async (req, res) => {
  const { userId } = req.params;
  await User.findOneAndDelete({ _id: userId });
  await Session.findOneAndDelete({uid: userId});
  res.status(200).json({ message: "user deleted" });
};

const getUserController = async (req, res) => {
  const { _id } = req.user;
  const result = await User.findOne({ _id});
  res.status(200).json(result);
};

module.exports = {
  register,
  login,
  logout,
  googleSignup,
  updateUserController,
  deleteUserController,
  refreshAccesToken,
  getUserController,
};
