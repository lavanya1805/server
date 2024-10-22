import UserModel from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Register new user
export const registerUser = async (req, res) => {
    try {
        const { username, password, firstname, lastname } = req.body;

        const oldUser = await UserModel.findOne({ username });
        if (oldUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        const newUser = new UserModel({
            username,
            password: hashedPass,
            firstname,
            lastname
        });

        const user = await newUser.save();
        const token = jwt.sign(
            { username: user.username, id: user._id },
            process.env.JWTKEY,
            { expiresIn: '1h' }
        );

        res.status(200).json({ user, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login User
export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const validity = await bcrypt.compare(password, user.password);
        if (!validity) {
            return res.status(400).json({ message: "Wrong password" });
        }

        const token = jwt.sign(
            { username: user.username, id: user._id },
            process.env.JWTKEY,
            { expiresIn: '1h' }
        );

        res.status(200).json({ user, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};