const express = require('express');
const UserCheckAuth = require('../middleware/user-check-auth');
const AdminAuth = require('../middleware/admin-check-auth');
const MakeRequest = require('../middleware/make-request');
const GroupController = require('../controllers/group');
const router = express.Router();

router.get('/', MakeRequest, UserCheckAuth, GroupController.all);
router.patch('/:id', MakeRequest, UserCheckAuth, GroupController.detail);
router.post('/follow', MakeRequest, UserCheckAuth, GroupController.follow);
router.delete('/unfollow', MakeRequest, UserCheckAuth, GroupController.follow);
router.post('/join', MakeRequest, UserCheckAuth, GroupController.join);
router.get('/subscribe', MakeRequest, UserCheckAuth, GroupController.subscribe);
router.get(
  '/unsubscribe/:id',
  MakeRequest,
  UserCheckAuth,
  GroupController.unsubscribe
);
// router.get(
//   '/subscribe',
//   MakeRequest,
//   UserCheckAuth,
//   GroupController.subscribeSingledata
// )
router.post('/rating', MakeRequest, UserCheckAuth, GroupController.rating);
router.get('/members/:id', MakeRequest, GroupController.getMembers);
router.post(
  '/intimate/request',
  MakeRequest,
  UserCheckAuth,
  GroupController.add
);
router.get('/intimate/:id', MakeRequest, GroupController.intimate);

// Admin

router.get(
  '/admin/subscribe/:id',
  MakeRequest,
  AdminAuth,
  GroupController.adminSubscribe
);
router.get(
  '/admin/subscribe',
  MakeRequest,
  AdminAuth,
  GroupController.adminSubscribeAll
);

router.post('/admin/rating', MakeRequest, AdminAuth, GroupController.rating);
router.get('/admin/intimate', MakeRequest, GroupController.intimateAdmin);
module.exports = router;
