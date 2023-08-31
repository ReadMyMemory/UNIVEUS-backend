import { baseResponse, errResponse, response } from "../../../config/response";
import axios from "axios";
import { validEmailCheck, createAuthNum, createAuthUser, checkAlarms } from "../user/userService";
import { isUser, isNicknameDuplicate, retrieveAlarms, getUserIdByEmail } from "./userProvider";
import jwt from "jsonwebtoken";
import { sendSMS } from "../../../config/NaverCloudClient";
import { naverCloudSensSecret } from "../../../config/configs";
import NodeCache from "node-cache";

const cache = new NodeCache();


/**구글 로그인 후 회원이면 토큰 발급, 회원이 아니면 err 발송 */
export const login = async(req, res) => {
    const GOOGLE_LOGIN_REDIRECT_URI = 'http://localhost:3000';
    const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
    const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

    const { code } = req.body;

    const resAuthCode = await axios.post(GOOGLE_TOKEN_URL, {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_LOGIN_REDIRECT_URI,
        grant_type: 'authorization_code',
    });

    const resUserInfo = await axios.get(GOOGLE_USERINFO_URL, {
      headers: {
          Authorization: `Bearer ${resAuthCode.data.access_token}`,
      },
    });

    const userEmail = resUserInfo.data.email;  

    if (validEmailCheck(userEmail) == false) {
        return res.send(errResponse(baseResponse.SIGNUP_EMAIL_KYONGGI));
    }
    if (!await isUser(userEmail)) {
        return res.send(response(baseResponse.LOGIN_NOT_USER, { userEmail : userEmail }));
    }
    
    const accessToken = await jwt.sign({ userEmail : userEmail }, process.env.ACCESS_TOKEN_SECRET, { expiresIn : '24days', issuer : 'univeus' })    
    if (accessToken) {
        return res.send(response(baseResponse.SUCCESS,{ accessToken }));
    }
}


/**회원가입 */
// export const signupRedirect = async(req, res) => {
//     const GOOGLE_SIGNUP_REDIRECT_URI = 'http://localhost:3000/user/signup/redirect';
//     const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
//     const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';


//     const { code } = req.body;

//     const resAuthCode = await axios.post(GOOGLE_TOKEN_URL, {
//         code,
//         client_id: process.env.GOOGLE_CLIENT_ID,
//         client_secret: process.env.GOOGLE_CLIENT_SECRET,
//         redirect_uri: GOOGLE_SIGNUP_REDIRECT_URI,
//         grant_type: 'authorization_code',
//     });

//     const resUserInfo = await axios.get(GOOGLE_USERINFO_URL, {
//         headers: {
//             Authorization: `Bearer ${resAuthCode.data.access_token}`,
//         },
//     });

//     const userEmail = resUserInfo.data.email;   

//     if (validEmailCheck(userEmail) == false) {
//         return res.send(errResponse(baseResponse.SIGNUP_EMAIL_KYONGGI));
//     }
//     if (await isUser(userEmail)) {
//         return res.send(errResponse(baseResponse.SIGNUP_EMAIL_DUPLICATE));
//     }
//     await createUser(userEmail);
//     res.send(response(baseResponse.SUCCESS));

// }



/** 인증번호 문자 전송 API */
export const sendAuthNumber = async(req, res) => {
    const to = req.body.phoneNumber;
    const sendAuth = createAuthNum();
    const content = `[UNIVEUS] 인증번호 [${sendAuth}]`;
    const { success } = await sendSMS(naverCloudSensSecret, { to, content });
    // 서버 캐시에 인증번호 임시 저장, 5분동안 유효
    cache.set("authNumber", sendAuth, 300);
    if (!success) {
        res.send(errResponse(baseResponse.SEND_AUTH_NUMBER_MSG_FAIL));
    } else {
        res.send(response(baseResponse.SEND_AUTH_NUMBER_MSG))
    };
}

/** 인증번호 검증 API */
export const verifyNumber = (req, res) => {
    const number = req.body.number;
    const authNumber = cache.get("authNumber");
    if (authNumber == number) {
        cache.del("authNumber");
        res.send(response(baseResponse.VERIFY_NUMBER_SUCCESS));
    }
    else {
        res.send(errResponse(baseResponse.VERIFY_NUMBER_FAIL));
    }

}

/**닉네임 중복 체크 API */
export const checkNickNameDuplicate = async (req, res) => {
    const nickname = req.body.nickname;
    // try {
        if (await isNicknameDuplicate(nickname)){
             return res.send(errResponse(baseResponse.NICK_NAME_DUPLICATE));
        }
        else {
            return res.send(response(baseResponse.SUCCESS));
        }
    // } catch(err) {
    //     res.send(errResponse(baseResponse.SERVER_ERROR));
    // }
}

/**유니버스 시작하기 API */
export const startUniveUs = async (req, res) => {
    // try {
        if (typeof req.body.phone == "undefined") return res.send(errResponse(baseResponse.SIGNUP_PHONE_NUMBER_EMPTY));

        if (typeof req.body.nickname == "undefined") return res.send(errResponse(baseResponse.SIGNUP_NICKNAME_EMPTY));

        if (typeof req.body.gender == "undefined") return res.send(errResponse(baseResponse.SIGNUP_GENDER_EMPTY));

        if (typeof req.body.major == "undefined") return res.send(errResponse(baseResponse.SIGNUP_MAJOR_EMPTY));

        if (typeof req.body.studentId == "undefined") return res.send(errResponse(baseResponse.SIGNUP_STUDENTID_EMPTY));   
            
        /** 헤더에서 userEmail 추출 */
        const userEmail = req.headers.useremail;
        const user = { userInfo : req.body, userEmail : userEmail};
        
        // try {
            createAuthUser(user);

            return res.send(response(baseResponse.SUCCESS));
        // } catch(err) {
            // return res.send(errResponse(baseResponse.SERVER_ERROR));
        // }

    // }catch(err) {
    //     return res.send(errResponse(baseResponse.SERVER_ERROR));
    // }
};

/**
 * API name : 알림 내역 조회
 * GET: /uesr/{user_id}/alarm
 */
export const getAlarms = async(req, res) => {
	
    const {user_id} = req.params; // 알림 받은 유저의 ID
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); // 접속 중인 유저 ID

    if(userIdFromJWT == user_id){
        const getAlarmsResult = await retrieveAlarms(userIdFromJWT); 
        return res.status(200).json(response(baseResponse.SUCCESS, getAlarmsResult));
    }
    else{
        return res.status(400).json(errResponse(baseResponse.USER_USERID_USERIDFROMJWT_NOT_MATCH));
    }  
};



/**
 * API name : 알림 확인 
 * PATCH: /uesr/{user_id}/alarm
 */
export const patchAlarms = async(req, res) => {

    const {user_id} = req.params; //알림을 확인하려는 유저 ID
    const {alarm_id} = req.body;
    const userEmail = req.verifiedToken.userEmail;
    const userIdFromJWT = await getUserIdByEmail(userEmail); // 접속 중인 유저 ID
    
    if(userIdFromJWT == user_id){
        const patchAlarmsResult = await checkAlarms(alarm_id);   
        return res.status(200).json(response(baseResponse.SUCCESS, patchAlarmsResult));
    } 
    else{ 
        return res.status(400).json(errResponse(baseResponse.USER_USERID_USERIDFROMJWT_NOT_MATCH));
    } 
};