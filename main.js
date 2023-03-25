
let APP_ID = "94769b1c4f7040c7a3b5fde3899ec3ab"

let token = null;
let uid = String(Math.floor(Math.random()*10000))

let client ;
let channel;

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

    channel = client.createChannel('main');
    await channel.join()

    channel.on('MemberJoined',handleuserJoined)

    client.on('MessageFromPeer',handleMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})
    document.getElementById('user1').srcObject = localStream
    
}

let handleMessageFromPeer = async (message,MemberId)=>{
    message = JSON.parse(message.text)
    console.log('message',message.text)
}

let handleuserJoined = async (MemberId)=>{
    console.log('a new user joined the channel :',MemberId)

    createOffer(MemberId)
}


    let createOffer = async (MemberId)=>{
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream()
    document.getElementById('user2').srcObject = remoteStream


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
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate','candidate':offer})},event.candidate)
        }
    }

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    //console.log("offer",offer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'offer','offer':offer})},MemberId)

}
init();