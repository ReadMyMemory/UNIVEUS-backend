import { selectUser, selectUserByNickname, selectUserIdByEmail, 
    selectUserIdByPostId, selectAlarms, selectUserById, 
    selectPhonNumById, selectUserNickNameById, selectUserIdByNickName, 
    selectPhoneByEmail, selectAuthStatusByEmail } from "./userDao"
import pool from "../../../config/database"

/** 회원인지 확인 */
export const isUser = async(email_id) => {

    const connection = await pool.getConnection(async (conn) => conn);
    const isUser = await selectUser(connection, email_id);
    connection.release();
    return isUser.length;
}

export const isNicknameDuplicate = async(nickname) => {
    const connection = await pool.getConnection(async (conn) => conn);
    const user = await selectUserByNickname(connection, nickname);
    connection.release();
    return user.length;
}

export const getUserById = async(user_id) => {//  id로 유저 조회

    const connection = await pool.getConnection(async (conn) => conn);
    const UserId = await selectUserById(connection, user_id);
    connection.release();
    return UserId[0];
};

export const getUserNickNameById = async(user_id) => {// id로 유저 닉네임 조회

    const connection = await pool.getConnection(async (conn) => conn);
    const UserNickName = await selectUserNickNameById(connection, user_id);
    connection.release();
    return UserNickName.nickname;
};

export const getUserIdByNickName = async(nickname) => {// 닉네임으로 유저 id 조회

    const connection = await pool.getConnection(async (conn) => conn);
    const UserId = await selectUserIdByNickName(connection, nickname);
    connection.release();
    return UserId.user_id;
};

export const getUserIdByEmail = async(email_id) => {// 이메일로 유저 id 조회

    const connection = await pool.getConnection(async (conn) => conn);
    const [UserId] = await selectUserIdByEmail(connection, email_id);
    connection.release();
    return UserId.user_id;
};
    
export const getUserIdByPostId = async(post_id) => {// post_id로 유저 id 조회

    const connection = await pool.getConnection(async (conn) => conn);
    const [UserId] = await selectUserIdByPostId(connection, post_id);
    connection.release();
    return UserId.user_id;
};

export const getPhonNumById = async(user_id) => {// id로 전화번호 조회

    const connection = await pool.getConnection(async (conn) => conn);
    const PhonNumResult = await selectPhonNumById(connection, user_id);

    connection.release();
    return PhonNumResult.phone;
};

export const retrieveAlarms = async(userIdFromJWT) => {// 알림 내역 조회

    const connection = await pool.getConnection(async (conn) => conn);
    const [alarmsResult] = await selectAlarms(connection, userIdFromJWT);
    connection.release();
    return alarmsResult;
};

/** 번호인증을 마친 user인지 */
export const isAuthNumber = async(userEmail) => {
    const connection = await pool.getConnection(async (conn) => conn);
    const authNumberResult = await selectPhoneByEmail(connection, userEmail);
    connection.release();
    
    if (authNumberResult[0][0].phone == null) return false;
    return true;
}

/** 본인인증을 마친 user인지 */
export const isAuthUser = async(userEmail) => {
    const connection = await pool.getConnection(async (conn) => conn);
    const isAuthUserResult = await selectAuthStatusByEmail(connection, userEmail);
    connection.release();

    if(isAuthUserResult[0][0].auth_status == null) return false;
    return true;
}


