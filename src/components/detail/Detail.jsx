import "./detail.css"

const Detail = () => {
  return (
    <div className='detail'>
      <div className="user">
        <img src="./avatar.png" alt="" />
        <h2>Shiva Tips</h2>
        <p>Lorem ipsum dolor sit amet.</p>
      </div>
      <div className="info">
        <div className="options">
          <div className="title">
            <span>Chat Settings</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="options">
          <div className="title">
            <span>Privacy & Help</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="options">
          <div className="title">
            <span>Shared Photos</span>
            <img src="./arrowDown.png" alt="" />
          </div>
          <div className="photos">
            <div className="photoitem">
              <div className="photoDetail">
                <img src="./ma photo.jpg" alt="" />
                <span>photo_2024</span>
              </div>
              <img src="./download.png" alt="" className="down"/>
            </div>
            <div className="photoitem">
              <div className="photoDetail">
                <img src="./ma photo.jpg" alt="" />
                <span>photo_2024</span>
              </div>
              <img src="./download.png" alt="" className="down"/>
            </div>
          </div>
        </div>
        <div className="options">
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <button>Block User</button>
        <button className="logout">Log Out</button>
      </div>
    </div>
  )
}

export default Detail