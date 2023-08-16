import dotenv from "dotenv";
dotenv.config();
import {baseResponse, response, errResponse} from "../../../config/response";
import { retrievePost, retrieveParticipant, retrieveParticipantList} from "./postProvider";
import { createPost, createImg, editPost, removePost, addScrap, addLike, applyParticipant, registerParticipant, refuseParticipant,addOneDayAlarm } from "./postService";
import {getUserIdByEmail} from "../user/userProvider";

/**
 * API name : 게시글 조회(게시글 + 참여자 목록)
 * GET: /post/{post_id}
 */
export const getPost = async(req, res) => {
	
    const {post_id} = req.params;
    const Post = await retrievePost(post_id); 
    
    if(Post){ // Post가 존재한다면
        const Participant = await retrieveParticipant(post_id); 
        return res.status(200).json(response(baseResponse.SUCCESS, {Post,Participant}));
    } 
    else{ 
        return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST))
    }  
};

/**
 * API name : 게시글 작성 >> 넘어온 데이터 형식에 따라 모임, 마감 시간 저장할 방식 수정해야 함
 * POST: /post
 */
export const postPost = async(req, res) => {
    
    const {category, limit_gender, limit_people, location, meeting_date, openchat, 
        end_date, title, content } = req.body; // 축제용 >> limit_gender
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); // 토큰을 통해 얻은 유저 ID 
    
    if(category == null || meeting_date == null || end_date == null || location == null || openchat == null){// 축제용 조건문
        return res.status(400).json(errResponse(baseResponse.POST_INFORMATION_EMPTY));
    }
    if(category != "축제"){ // 축제용 조건문
        return res.status(400).json(errResponse(baseResponse.POST_CATEGORY_LIMIT));
    }    
    if(limit_people != 4 && limit_people != 6){ // 축제용 조건문
        return res.status(400).json(errResponse(baseResponse.POST_PEOPLE_LIMIT));
    }    
    if(location.length > 24){
        return res.status(400).json(errResponse(baseResponse.POST_LOCATION_LENGTH));
    }    
    if(title.length > 48){ 
        return res.status(400).json(errResponse(baseResponse.POST_TITLE_LENGTH));
    }
    if(content.length > 500){ // 축제용 조건문
        return res.status(400).json(errResponse(baseResponse.POST_CONTENT_LENGTH));
    }
    const postPostResult = await createPost(userIdFromJWT, category, limit_gender, limit_people, location, meeting_date, openchat, 
        end_date, title, content);
    
    return res.status(200).json(response(baseResponse.SUCCESS, postPostResult));
};

/**
 * API name : 게시글 수정
 * PATCH: /post/{post_id} 
 */
export const patchPost =  async(req, res) => {

    const {post_id} = req.params;
    const {user_id, category, limit_gender,limit_people, location, meeting_date, openchat, 
        end_date, post_status, title,content} = req.body;
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); // 토큰을 통해 얻은 유저 ID 
    
    if(user_id == userIdFromJWT){  //접속한 유저가 작성자라면
        const Post = await retrievePost(post_id); 
        if(Post){
            if(category == null || meeting_date == null || end_date == null || location == null || openchat == null){// 축제용 조건문
                return res.status(400).json(errResponse(baseResponse.POST_INFORMATION_EMPTY));
            }
            if(category != "축제"){ // 축제용 조건문
                return res.status(400).json(errResponse(baseResponse.POST_CATEGORY_LIMIT));
            }    
            if(limit_people != 4 && limit_people != 6){ // 축제용 조건문
                return res.status(400).json(errResponse(baseResponse.POST_PEOPLE_LIMIT));
            }    
            if(location.length > 24){
                return res.status(400).json(errResponse(baseResponse.POST_LOCATION_LENGTH));
            }    
            if(title.length > 48){ 
                return res.status(400).json(errResponse(baseResponse.POST_TITLE_LENGTH));
            }
            if(content.length > 500){ // 축제용 조건문
                return res.status(400).json(errResponse(baseResponse.POST_CONTENT_LENGTH));
            }
            const patchPostResult = await editPost(category, limit_gender,limit_people, location, meeting_date, openchat, 
                end_date, post_status, title,content, post_id);   
            return res.status(200).json(response(baseResponse.SUCCESS, patchPostResult));
        } 
        else{ 
            return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST));
        } 
    }
    else{
        return res.status(400).json(errResponse(baseResponse.USER_USERID_USERIDFROMJWT_NOT_MATCH));
    }
    
};

/**
 * API name : 게시글 삭제
 * DELETE: /post/{post_id}
 */
export const deletePost =  async(req, res) => {

    const {post_id} = req.params;
    const {user_id} = req.body; // 작성자의 ID
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); // 토큰을 통해 얻은 유저 ID 
    
    if(user_id == userIdFromJWT){  //접속한 유저가 작성자라면
        const Post = await retrievePost(post_id); 
        if(Post){ 
            const deletePostResult = await removePost(post_id);
            return res.status(200).json(response(baseResponse.SUCCESS, deletePostResult));
        } 
        else{ 
            return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST))        
        }
    }
    else{
        return res.status(400).json(errResponse(baseResponse.USER_USERID_USERIDFROMJWT_NOT_MATCH));
    }
};

/**
 * API name : 게시글 스크랩 >> 축제 때는 필요 X
 * PATCH: /post/{post_id}/scrap
 */
export const patchScrap = async(req, res) => {

    const {post_id} = req.params;
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); //토큰을 통한 이메일로 유저 id 구하기

    const Post = await retrievePost(post_id); 
    
    if(Post){ // Post가 존재한다면
        const addScrapResult = await addScrap(post_id, userIdFromJWT);   
        return res.status(200).json(response(baseResponse.SUCCESS, addScrapResult));
    } 
    else{ 
        return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST))
    } 
};

/**
 * API name : 게시글 좋아요 >> 축제 때는 필요 X
 * PATCH: /post/{post_id}/like
 */
export const patchLike = async(req, res) => {

    const {post_id} = req.params;
    const Post = await retrievePost(post_id); 
    
    if(Post){ // Post가 존재한다면
        const addLikeResult = await addLike(post_id);   
        return res.status(200).json(response(baseResponse.SUCCESS, addLikeResult));
    } 
    else{ 
        return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST))
    } 
};

/**
 * API name : 게시글 참여 신청 + 참여 신청 알람(to 작성자)
 * POST: /post/{post_id}/participant/apply
 */
export const postParticipant = async(req, res) => {
    
    const {post_id} = req.params;
    const {user_id} = req.body;// 작성자 ID
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); // 토큰을 통해 얻은 유저 ID (신청자 ID 여야 함)
    
    const Post = await retrievePost(post_id); 
    
    if(Post){ // Post가 존재한다면 
        const postParticipantResult = await applyParticipant(post_id, userIdFromJWT, user_id);
        return res.status(200).json(response(baseResponse.SUCCESS, postParticipantResult));
    } 
    else{ 
        return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST))
    }
};

/**
 * API name  게시글 참여자 신청 내역 조회 
 * GET: /post/{post_id}/participant
 */
export const getParticipant = async(req, res) => {
	
    const {post_id} = req.params;
    const {user_id} = req.body; // 작성자 ID
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); // 토큰을 통해 얻은 유저 ID (작성자 ID 여야 함)
    
    if(user_id == userIdFromJWT){ //접속한 유저가 작성자라면
        const Post = await retrievePost(post_id); 

        if(Post){ 
            const getParticipantList = await retrieveParticipantList(post_id); 
            return res.status(200).json(response(baseResponse.SUCCESS, getParticipantList));
        } 
        else{ 
            return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST));
        }  
    }
    else{
        return res.status(400).json(errResponse(baseResponse.USER_USERID_USERIDFROMJWT_NOT_MATCH));
    }
};

/**
 * API name : 게시글 참여자 승인 + 참여 승인 알람(to 참여자)
 * PATCH: /post/{post_id}/participant/register
 */
export const patchParticipant = async(req, res) => {
    
    const {post_id} = req.params;
    const {participant_id, user_id} = req.body;// 참여 테이블 ID, 작성자의 ID
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); // 토큰을 통해 얻은 유저 ID (작성자 ID 여야 함)
    
    if(user_id == userIdFromJWT){
        const Post = await retrievePost(post_id); 
        if(Post){
            const patchParticipantResult = await registerParticipant(post_id, participant_id);
            return res.status(200).json(response(baseResponse.SUCCESS, patchParticipantResult));
        } 
        else{ 
            return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST));
        }
    }
    else{
        return res.status(400).json(errResponse(baseResponse.USER_USERID_USERIDFROMJWT_NOT_MATCH));
    }
};

/**
 * API name : 게시글 참여자 거절 + 참여 거절 알람(to 참여자)
 * DELETE: /{post_id}/participant/refuse
 */
export const deleteParticipant = async(req, res) => {
    
    const {post_id} = req.params;
    const {participant_id, user_id} = req.body;
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); // 토큰을 통해 얻은 유저 ID (작성자 ID 여야 함)
    
    const Post = await retrievePost(post_id); 
    
    if(user_id == userIdFromJWT){
        if(Post){ 
            const deleteParticipantResult = await refuseParticipant(post_id, participant_id);
            return res.status(200).json(response(baseResponse.SUCCESS, deleteParticipantResult));
        } 
        else{ 
            return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST));
        }
    }
    else{
        return res.status(400).json(errResponse(baseResponse.USER_USERID_USERIDFROMJWT_NOT_MATCH));
    }
};

/**
 * API name : 게시글 모임 1일 전 알림 
 * POST: post/{post_id}/participant/onedayalarm
 */
export const postOneDayAlarm = async(req, res) => {
    
    const {post_id} = req.params;
    const {user_id} = req.body;// 참여자 ID들을 다 받아와야 함 >> 보류
    
    const Post = await retrievePost(post_id); 
    
    if(Post){ 
        const postOneDayAlarmResult = await addOneDayAlarm(post_id, user_id);
        return res.status(200).json(response(baseResponse.SUCCESS, postOneDayAlarmResult));
    } 
    else{ 
        return res.status(404).json(errResponse(baseResponse.POST_POSTID_NOT_EXIST))
    }
};