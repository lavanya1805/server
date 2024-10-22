import express from 'express';
import { getAllUsers, getUser, updateUser, followUser, unfollowUser } from '../controllers/UserController.js';

const router = express.Router();

router.get('/all', getAllUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.put('/:id/follow', followUser);
router.put('/:id/unfollow', unfollowUser);

export default router;