import "./userInfo.css"
import { useAuth } from '../../../context/AuthContext';

const UserInfo = () => {
  const { user } = useAuth();

  return (
    <div className='userinfo'>
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{user?.username}</h2>
      </div>
      <div className="icons">
        <img src="./more.png" alt="" />
      </div>
    </div>
  );
};

export default UserInfo;