const chatApp = {
    room: $("body").attr("data-room"),
    socket: io.connect("https://watchparty.live"),
    infoShowing: false,
    showInfo: function(){
        if(chatApp.infoShowing){
            $(".chatBody").removeClass("showin")
            $("header .infoBtn").removeClass('close')
            chatApp.infoShowing = false
        }else{
            $(".chatBody").addClass("showin")
            $("header .infoBtn").addClass('close')
            chatApp.infoShowing = true
        }
    },
    shareVideoChat: function(){
        let videochatURL = "https://meet.jit.si/watchpartylive/"+uuidv4()
        $('.messageList').append(`
            <div class="message me">
                <div class="name">You shared a <a href="${videochatURL}" target="_blank" class="pure-button">video chat</a></div>
            </div> 
        `)
        $(".chatList").scrollTop($(".chatList")[0].scrollHeight);
        chatApp.socket.emit("videochat", {
            url: videochatURL,
            room: chatApp.room
        });
    },
    messageInput: {
        enterKey: function(e){
            var key = e.which || e.keyCode;
            if(key == 13 && !e.shiftKey) {
                e.preventDefault()
                chatApp.messageInput.sendMessage()
            }
        },
        sendMessage: function(){
            let textareaElem = $(".messageInput textarea")
            let message = textareaElem.val().trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            if(message != ""){
                let t = moment.utc()
                chatApp.insertMessage("You", message, t, "me")
                textareaElem.val("").focus()
                chatApp.socket.emit("message", {
                    message: message,
                    timestamp: t,
                    room: chatApp.room
                });
            }
        }
    },
    insertMessage: function(nickname, message, timestamp, me){
        $('.messageList').append(`
            <div class="message ${me}">
                <div class="name">${nickname} &middot; ${moment(timestamp).local().format("h:mm a")}</div>
                <div class="messageContent">${message}</div>
            </div> 
        `)
        let inserted = $('.messageList .message.me').last()
        if(inserted.outerHeight() > 48){
           inserted.css('text-align','left') 
        }
        $(".chatList").scrollTop($(".chatList")[0].scrollHeight); 
    },
    nickname: {
        init: function(){
            $('.username input').keydown(chatApp.nickname.limitInput).keyup(chatApp.nickname.limitLength).focus()
            $(".username button").on("click", chatApp.nickname.checkNickname)
        },
        limitLength: function(e){
            if($(this).val().trim().length > 20 ) return false
        },
        limitInput: function(e){
            $(".username").removeClass("error")
            var key = e.which || e.keyCode;
            if(key == 13){
                chatApp.nickname.checkNickname()
                return false;
            }
            if(e.shiftKey && key >= 48 && key <= 57) {
                return false;
            } else {
                if(key >= 186 && key <= 187 || key >= 191 && key <= 222 || key == 32) {
                    return false;
                } else {
                    return true; 
                }
            }
        },
        checkNickname: function(){
            let nicknameVal = $(".username input").val().trim()

            if(nicknameVal == "" || !nicknameVal.match(/^([0-9]|[a-z])+([0-9a-z]+)$/i) || nicknameVal.length > 20){
                $(".username").addClass("error")
                $(".username .errormsg").text("*invalid")
                $(".username input").focus()
                return 
            } else {
                chatApp.socket.emit('subscribe', { room: chatApp.room, name: nicknameVal }, (data, users_online) => {
                    if(data) {
                        $(".messageInput .nickname").html(nicknameVal)
                        $(".titleBox .online").html(" · "+users_online+" online")
                        $(".overlay").slideUp("fast")
                        chatApp.initApp()
                    } else {
                        $(".username").addClass("error")
                        $(".username .errormsg").text("*taken")
                        $(".username input").focus()
                    }
                });
            }
        }
    },
    initApp: function(){
        $("header .infoBtn").on("click", chatApp.showInfo)
        $("header .videocallBtn").on("click", chatApp.shareVideoChat)
        $(".messageInput textarea").on("keydown", chatApp.messageInput.enterKey)
        $(".messageInput button").on('click', chatApp.messageInput.sendMessage);
        chatApp.socket.on('broadcat', data => {
            chatApp.insertMessage(data.nickname, data.message, data.timestamp, "")
        })
        chatApp.socket.on('videochat', data => {
            $('.messageList').append(`
                <div class="message">
                    <div class="name">${data.nickname} shared a <a href="${data.url}" target="_blank" class="pure-button">video chat</a></div>
                </div> 
            `)
            $(".chatList").scrollTop($(".chatList")[0].scrollHeight);
        })
        chatApp.socket.on('users_online', num => {
            $(".titleBox .online").html(" · "+num+" online")
        })
        window.addEventListener("unload", function(e){
            chatApp.socket.emit('unsubscribe', chatApp.room);
        }, false);
    }
}
chatApp.nickname.init()
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}