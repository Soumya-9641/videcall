
let APP_ID = "94769b1c4f7040c7a3b5fde3899ec3ab"

let token = null;
let uid = String(Math.floor(Math.random()*10000))

let client ;
let channel;

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId){
    window.location = 'lobby.html'
}

let localStream;
let remoteStream;
let peerConnection ;

const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']
        }
    ]
}  

let init = async ()=>{
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid,token});

    channel = client.createChannel(roomId);
    await channel.join()

    channel.on('MemberJoined',handleuserJoined)

    channel.on("MemberLeft",handleUserLeft)

    client.on('MessageFromPeer',handleMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})
    document.getElementById('user1').srcObject = localStream
    
}
let handleUserLeft = (MemberId)=>{
    document.getElementById('user2').style.display = 'none'
}

// let handleMessageFromPeer = async (message,MemberId)=>{
//     message = JSON.parse(message.text)
//     console.log('message',message.text)
// }

let handleMessageFromPeer = async (message, MemberId) => {

    message = JSON.parse(message.text)

    if(message.type === 'offer'){
        createAnswer(MemberId, message.offer)
    }

    if(message.type === 'answer'){
        addAnswer(message.answer)
    }

    if(message.type === 'candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }


}


let handleuserJoined = async (MemberId)=>{
    console.log('a new user joined the channel :',MemberId)

    createOffer(MemberId)
}


let createPeerConnection = async (MemberId)=>{
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream()
    document.getElementById('user2').srcObject = remoteStream
    document.getElementById('user2').style.display = 'block'


    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track,localStream)
    });

    peerConnection.ontrack = (event)=>{
        event.streams[0].getTracks().forEach((track)=>{
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event)=>{
        if(event.candidate){
            console.log("new ICE candidate:",event.candidate)
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate','candidate':event.candidate})},MemberId)
        }
    }

    // let offer = await peerConnection.createOffer()
    // await peerConnection.setLocalDescription(offer)
    // //console.log("offer",offer)

    // client.sendMessageToPeer({text:JSON.stringify({'type':'offer','offer':offer})},MemberId)

}
let createOffer = async (MemberId) => {
    await createPeerConnection(MemberId)

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberId)
}
let createAnswer = async (MemberId, offer) => {
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberId)
}

let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

let leaveChannel = async ()=>{
    await channel.leave();
    await client.logout()

}
window.addEventListener('beforeunload',leaveChannel); 
init();