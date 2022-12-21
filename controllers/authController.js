const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {Balance} = require("../models/balance");

const {User} = require("../models/user");
const {SECRET_KEY} = process.env;

const {RequestError} = require("../helpers");

const register = async(req, res)=> {
    const {username, email, password, name} = req.body;

    const user = await User.findOne({email});
    if(user) {
        throw RequestError(409, "Email in use")
    }

    const hashPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({username, email, password: hashPassword, name});

    const owner = newUser._id;

    await Balance.create({owner})

    res.status(201).json({
        "user": {
            "name": newUser.name,
            "email": newUser.email,
        }
    })
};

const login = async(req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(!user) {
        throw RequestError(401, "Invalid email or password");
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if(!passwordCompare) {
        throw RequestError(401, "Invalid email or password");
    }

    const paylaod = {
        id: user._id,
    }

    const token = jwt.sign(paylaod, SECRET_KEY, {expiresIn: "23h"})
    await User.findByIdAndUpdate(user._id, {token})

    res.json({
        token,
        user: {
            "email": user.email,
        }
    })
};

const logout = async(req, res) => {
    const {_id} = req.user;

    await User.findByIdAndUpdate(_id, {token: ""});

    res.status(204).json({message: "logout success"});
}

module.exports = {
    register,
    login,
    logout,
}