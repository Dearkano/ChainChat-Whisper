import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import ChatHeader from '../ChatHeader';
import InputArea from '../InputArea';
import ChatContentList from '../ChatContentList';
import PersonalInfo from '../PersonalInfo';
import notification from '../Notification';
import '../../assets/chat.scss';
import ShareModal from '../ShareModal';
import Chat from '../../modules/Chat';
import debounce from '../../utils/debounce';
import Button from '../Button';
import { encodeToHex } from '../../utils/hexUtils';
import InitApp from '../../modules/InitApp';

export default class PrivateChat extends Component {
  constructor() {
    super();
    this._sendByMe = false;
    this._userInfo = JSON.parse(localStorage.getItem('userInfo'));
    this._hasBeenFriend = false;
    this._chat = new Chat();
    this.state = {
      showPersonalInfo: false,
      showShareModal: false,
      toUserInfo: {},
      disableJoinButton: false,
    };
  }

  sendMessage = async (inputMsg = '', attachments = []) => {
    if (inputMsg.trim() === '' && attachments.length === 0) return;
    const { user_id, avatar, username, github_id } = this._userInfo;
    const {
      allPrivateChats,
      homePageList,
      updateHomePageList,
      addPrivateChatMessages,
    } = this.props;
    let type = 'text';
    let metaData = JSON.stringify({
      type,
      text: inputMsg,
    });
    if (inputMsg === '' && attachments.length !== 0) {
      type = attachments[0].type;
      const fileName = attachments[0].name;
      if (type === 'text' && fileName.slice(fileName.length - 4, fileName.length) === '.txt') {
        type = 'file';
      }
      const body = new FormData();
      const headers = new Headers();
      headers.append('Content-Type', 'multipart/form-data');
      body.append('file', attachments[0].file);
      const response = await fetch(`http://39.108.80.53:10792/un/files`, {
        method: 'post',
        body,
      });
      const data = await response.json();
      const afid = data.afid;
      metaData = JSON.stringify({
        type,
        afid,
        fileName: attachments[0].name,
      });
    }
    const data = {
      from_user: user_id, // 自己的id
      to_user: this.friendId, // 对方id
      avatar, // 自己的头像
      username: username || user_id,
      github_id,
      message: `${username}: ${metaData}`, // 消息内容
      attachments, // 附件
      // time: Date.parse(new Date()) / 1000 // 时间
    };
    this._sendByMe = true;
    // const response = await request.socketEmitAndGetResponse('sendPrivateMsg', data, error => {
    //   notification('消息发送失败', 'error', 2);
    // });
    const msg = JSON.stringify(data);
    const postData = {
      ttl: 7,
      topic: encodeToHex('chainchat').substring(0, 10),
      powTarget: 2.01,
      powTime: 100,
      payload: encodeToHex(msg),
      pubKey: this.friendId,
      sig: this._userInfo.asymKeyId,
    };
    const shh = InitApp.shh;
    shh.post(postData);
    const response = {
      attachments,
      avatar: '',
      from_user: this._userInfo.pubKey,
      message: `${this._userInfo.username}: ${metaData}`,
      username: this._userInfo.username,
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      to_user: this.friendId,
    };

    addPrivateChatMessages({
      allPrivateChats,
      message: response,
      chatId: this.friendId,
    });
    // eslint-disable-next-line no-restricted-globals
    let messageForHomePage = '';
    if (type === 'image') {
      messageForHomePage = `${this._userInfo.username}: ${JSON.stringify({
        text: '[图片]',
        type,
      })}`;
    } else if (type === 'text') {
      messageForHomePage = `${this._userInfo.username}: ${JSON.stringify({
        text: inputMsg,
        type,
      })}`;
    } else {
      messageForHomePage = `${this._userInfo.username}: ${JSON.stringify({
        text: '[文件]',
        type,
      })}`;
    }
    const dataForHomePage = {
      ...response,
      message: messageForHomePage,
    };
    updateHomePageList({
      data: dataForHomePage,
      homePageList,
      myUserId: user_id,
    });
  };

  addAsTheContact = async () => {
    if (this.state.disableJoinButton) return;
    this.setState({
      disableJoinButton: true,
    });
    const { allPrivateChats, homePageList, updateHomePageList, addPrivateChatInfo } = this.props;
    if (this.chatId === this._userInfo.user_id) {
      notification('不能添加自己为联系人哦', 'error', 2);
      return;
    }
    // const data = await request.socketEmitAndGetResponse(
    //   'addAsTheContact',
    //   { user_id: this._userInfo.user_id, from_user: this.friendId },
    //   error => {
    //     notification('添加失败！', 'error', 1.5);
    //     this.setState({ disableJoinButton: false });
    //   },
    // );
    const data = {
      user_id: this.chatId,
    };
    addPrivateChatInfo({
      allPrivateChats,
      chatId: this.chatId,
      userInfo: data,
    });
    const dataInHomePageList = {
      ...data,
      to_user: this.chatId,
      message: '添加联系人成功，给我发消息吧:)',
      time: Date.parse(new Date()) / 1000,
    };
    updateHomePageList({
      data: dataInHomePageList,
      homePageList,
    });
  };

  _showPersonalInfo(value) {
    this.setState({
      showPersonalInfo: value,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { relatedCurrentChat, match } = nextProps;
    // console.log('shouldComponentUpdate', relatedCurrentChat, chatId, this.props.chatId, this._sendByMe);
    if (relatedCurrentChat || match.params.user_id !== this.chatId || this._sendByMe) {
      this._sendByMe = false;
      return true;
    }

    const { showPersonalInfo } = nextState;
    if (showPersonalInfo !== this.state.showPersonalInfo) return true;

    return false;
  }

  _showShareModal = () => {
    this.setState(state => ({
      showShareModal: !state.showShareModal,
    }));
  };

  _deletePrivateChat = () => {
    const { deletePrivateChat, allPrivateChats } = this.props;
    deletePrivateChat({
      allPrivateChats,
      chatId: this.chatId,
    });
  };

  _deleteHomePageList = () => {
    const { deleteHomePageList, homePageList } = this.props;
    deleteHomePageList({
      homePageList,
      chatId: this.chatId,
    });
  };

  componentDidMount() {
    const { allPrivateChats } = this.props;
    const chatItem = allPrivateChats && allPrivateChats.get(this.chatId);
    if (!chatItem && localStorage.getItem('privateChatList')) {
      // // window.socket.emit('getUserInfo', this.chatId, toUserInfo => {
      //   this.setState({
      //     toUserInfo,
      //   });
      // });
      const privateChatList = new Map(JSON.parse(localStorage.getItem('privateChatList')));
      const toUserInfo = privateChatList.get(this.chatId);
      this.setState({ toUserInfo });
    }
  }

  render() {
    const {
      allPrivateChats,
      shareData,
      homePageList,
      allGroupChats,
      deleteHomePageList,
      deletePrivateChat,
      initApp,
    } = this.props;
    const { showPersonalInfo, showShareModal, toUserInfo, disableJoinButton } = this.state;
    if ((!allPrivateChats && !allPrivateChats.size) || !this.chatId) return null;
    const chatItem = allPrivateChats.get(this.chatId);
    const messages = chatItem ? chatItem.messages : [];
    const userInfo = chatItem ? chatItem.userInfo : toUserInfo;
    return (
      <div className="chat-wrapper">
        <ShareModal
          title="分享此联系人给"
          modalVisible={showShareModal}
          chatId={this.chatId}
          showShareModal={this._showShareModal}
          cancel={this._showShareModal}
          allGroupChats={allGroupChats}
          homePageList={homePageList}
        />{' '}
        <ChatHeader
          showPersonalInfo={() => this._showPersonalInfo(true)}
          title={(userInfo && userInfo.name) || this.chatId}
          showShareModal={this._showShareModal}
          chatType="private"
          showShareIcon={!!chatItem}
        />{' '}
        <ChatContentList
          chat={this._chat}
          chats={allPrivateChats}
          ChatContent={messages}
          chatId={this.chatId}
          chatType="privateChat"
          clickAvatar={() => this._showPersonalInfo(true)}
        />{' '}
        <PersonalInfo
          userInfo={userInfo}
          hide={() => this._showPersonalInfo(false)}
          modalVisible={showPersonalInfo}
          homePageList={homePageList}
          allPrivateChats={allPrivateChats}
          deleteHomePageList={deleteHomePageList}
          deletePrivateChat={deletePrivateChat}
        />{' '}
        {chatItem ? (
          <InputArea shareData={shareData} sendMessage={this.sendMessage} />
        ) : (
          initApp && (
            <Button
              clickFn={this.addAsTheContact}
              value="加为联系人"
              disable={disableJoinButton}
              className="button"
            />
          )
        )}{' '}
      </div>
    );
  }

  get chatId() {
    return this.props.location.pathname.split('private_chat/')[1];
  }

  // question: writing as this is ok ?
  get friendId() {
    return this.props.location.pathname.split('private_chat/')[1];
  }
}

PrivateChat.propTypes = {
  allPrivateChats: PropTypes.instanceOf(Map),
  allGroupChats: PropTypes.instanceOf(Map),
  homePageList: PropTypes.array,
  updateHomePageList: PropTypes.func,
  addPrivateChatMessages: PropTypes.func,
  addPrivateChatInfo: PropTypes.func,
  shareData: PropTypes.object,
  deleteHomePageList: PropTypes.func,
  deletePrivateChat: PropTypes.func,
  initApp: PropTypes.bool,
};

PrivateChat.defaultProps = {
  allPrivateChats: new Map(),
  allGroupChats: new Map(),
  homePageList: [],
  updateHomePageList: undefined,
  addPrivateChatMessages: undefined,
  addPrivateChatInfo: undefined,
  shareData: undefined,
  deleteHomePageList() {},
  deletePrivateChat() {},
  initApp: false,
};
