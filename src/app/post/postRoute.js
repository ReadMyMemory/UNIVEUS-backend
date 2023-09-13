import express from "express"
import { uploadImage } from '../../../config/imageUploader';
import {getPost, postPost, patchPost, deletePost,patchScrap, patchLike, postParticipant, 
    getParticipant, patchParticipant, deleteParticipant, patchStatus,postOneDayAlarm, participateUniveus,
    cancelParticipant, postImage} from "./postController";
import { jwtMiddleware } from "../../../config/jwtMiddleWare";
import {wrapAsync} from "../../../config/errorhandler";

const postRouter = express.Router();

postRouter.get('/:post_id',jwtMiddleware, wrapAsync(getPost)); // 게시글(+참여자 목록) 조회 API
postRouter.post('/', jwtMiddleware, wrapAsync(postPost)); // 게시글 작성 API
postRouter.post('/image/upload',
    jwtMiddleware,
    uploadImage.array('image', 4),
    wrapAsync(postImage)
);
postRouter.patch('/:post_id', jwtMiddleware, wrapAsync(patchPost)); // 게시글 수정 API
postRouter.delete('/:post_id', jwtMiddleware, wrapAsync(deletePost)); // 게시글 삭제 API
postRouter.patch('/:post_id/scrap', jwtMiddleware, wrapAsync(patchScrap)); // 게시글 스크랩 API
postRouter.patch('/:post_id/like', jwtMiddleware, wrapAsync(patchLike)); // 게시글 좋아요 API
postRouter.get('/:post_id/participant', jwtMiddleware, wrapAsync(getParticipant)); // 게시글 참여자 신청 내역 조회 API
postRouter.post('/:post_id/participant/apply', jwtMiddleware, wrapAsync(postParticipant)); // 게시글 참여 신청 API + 참여 신청 알람(to 작성자) API
postRouter.patch('/:post_id/participant/register', jwtMiddleware, wrapAsync(patchParticipant)); // 게시글 참여 승인 API + 참여 승인 알람(to 참여자) API
postRouter.delete('/:post_id/participant/refuse', jwtMiddleware, wrapAsync(deleteParticipant)); // 게시글 참여 거절 API + 참여 거절 알람(to 참여자) API
postRouter.patch('/:post_id/status', jwtMiddleware, wrapAsync(patchStatus)); // 모집 마감으로 상태 변경 API
postRouter.post('/:post_id/participant/onedayalarm', wrapAsync(postOneDayAlarm)); // 게시글 모임 1일 전 알림 API
postRouter.post('/:post_id/participant', jwtMiddleware, wrapAsync(participateUniveus)); // 유니버스 참여 + 자동 모집 마감 API (축제용)
postRouter.delete('/:post_id/participant/cancel', jwtMiddleware, wrapAsync(cancelParticipant)); // 유니버스 참여 취소 API





export default postRouter;