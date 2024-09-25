// ========================== start session ========================
$(document).ready(function () {

	//get user ID
	const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const userid = urlParams.get('userid');
	user_id = userid;
	//get session number
	const session_num = urlParams.get('n');
	
	$(".widget").toggle();
	
	showBotTyping();
	$('.usrInput').attr("disabled",true);
	$(".usrInput").prop('placeholder', "Wait for DeliBot's message.");
	
	
	//start a session
	if (session_num == "pre"){
		send('/start_session_predeliberation{"session_num":"pre"}');
	} else if (session_num == "post"){
		send('/start_session_postdeliberation{"session_num":"post"}');
	}
	
})

//=====================================	user enter or sends the message =====================
$(".usrInput").on("keyup keypress", function (e) {
	var keyCode = e.keyCode || e.which;

	var text = $(".usrInput").val();
	if (keyCode === 13) {

		if (text == "" || $.trim(text) == "") {
			e.preventDefault();
			return false;
		} else {

			$("#paginated_cards").remove();
			$(".suggestions").remove();
			$(".usrInput").blur();
			setUserResponse(text);
			send(text);
			e.preventDefault();
			return false;
		}
	}
});

$("#sendButton").on("click", function (e) {
	var text = $(".usrInput").val();
	if (text == "" || $.trim(text) == "") {
		e.preventDefault();
		return false;
	}
	else {
		
		$(".suggestions").remove();
		$("#paginated_cards").remove();
		$(".usrInput").blur();
		setUserResponse(text);
		send(text);
		e.preventDefault();
		return false;
	}
})

//==================================== Set user response =====================================
function setUserResponse(message) {
	var UserResponse = '<img class="userAvatar" src=' + "/img/user_picture.png" + '><p class="userMsg">' + message + ' </p><div class="clearfix"></div>';
	$(UserResponse).appendTo(".chats").show("slow");

	$(".usrInput").val("");
	scrollToBottomOfResults();
	showBotTyping();
	$('.usrInput').attr("disabled",true);
	$(".usrInput").prop('placeholder', "Wait for DeliBot's response.");
	$(".suggestions").remove();
}

//=========== Scroll to the bottom of the chats after new message has been added to chat ======
function scrollToBottomOfResults() {

	var terminalResultsDiv = document.getElementById("chats");
	terminalResultsDiv.scrollTop = terminalResultsDiv.scrollHeight;
}

//============== send the user message to rasa server =============================================
function send(message) {
	var url = document.location.protocol + "//" + document.location.hostname;
	$.ajax({

		url: url + "/rasa/webhooks/rest/webhook",
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify({ message: message, sender: user_id }),
		success: function (botResponse, status) {
			console.log("Response from Rasa: ", botResponse, "\nStatus: ", status);

			setBotResponse(botResponse);

		},
		error: function (xhr, textStatus, errorThrown) {

			// if there is no response from rasa server
			setBotResponse("");
			console.log("Error from bot end: ", textStatus);
		}
	});
}

//=================== set bot response in the chats ===========================================
function setBotResponse(response) {

	//display bot response after the number of miliseconds caputred by the variable 'delay_first_message'
	var delay_first_message = 500;
	if (response.length >=1) {
		delay_first_message = Math.min(Math.max(response[0].text.length * 45, 800), 5000);
	}
	setTimeout(function () {
		hideBotTyping();
		if (response.length < 1) {
			//if there is no response from Rasa, send  fallback message to the user
			var fallbackMsg = "I am facing some issues, please try again later!!!";

			var BotResponse = '<img class="botAvatar" src="/img/chatbot_picture.png"/><p class="botMsg">' + fallbackMsg + '</p><div class="clearfix"></div>';

			$(BotResponse).appendTo(".chats").hide().fadeIn(1000);
			scrollToBottomOfResults();
		}
		//if we get response from Rasa
		else {
			//check if the response contains "text"
			if (response[0].hasOwnProperty("text")) {
				var response_text = response[0].text.split("\n")
				for (j = 0; j < response_text.length; j++){
					var BotResponse = '<img class="botAvatar" src="/img/chatbot_picture.png"/><p class="botMsg">' + response_text[j] + '</p><div class="clearfix"></div>';
					$(BotResponse).appendTo(".chats").hide().fadeIn(1000);
				}
			}

			//check if the response contains "buttons" 
			if (response[0].hasOwnProperty("buttons")) {
				addSuggestion(response[0].buttons);
			//If there are no buttons and there is a single response from the bot, enable the textfield for user input again.
			} else if (response.length == 1){
				$('.usrInput').attr("disabled",false);
				$(".usrInput").prop('placeholder', "Type a message...");
			}

			scrollToBottomOfResults();
		
		}
	}, delay_first_message);
	

	//if there is more than 1 message from the bot
	if (response.length > 1){
		//show typing symbol again
		var delay_typing = 600 + delay_first_message;
		setTimeout(function () {
		showBotTyping();
		}, delay_typing)
		
		//send remaining bot messages if there are more than 1
		var summed_timeout = delay_typing;
		for (var i = 1; i < response.length; i++){
			
			//Add delay based on the length of the next message
			summed_timeout += Math.min(Math.max(response[i].text.length * 45, 800), 5000);
			doScaledTimeout(i, response, summed_timeout)
			
		}
	}
	
}


//====================================== Scaled timeout for showing messages from bot =========
// See here for an explanation on timeout functions in javascript: https://stackoverflow.com/questions/5226285/settimeout-in-for-loop-does-not-print-consecutive-values.
function doScaledTimeout(i, response, summed_timeout) {
	
	setTimeout(function() {
		hideBotTyping();
			
		//check if the response contains "text"
		if (response[i].hasOwnProperty("text")) {
			var response_text = response[i].text.split("\n")
			for (j = 0; j < response_text.length; j++){
				var BotResponse = '<img class="botAvatar" src="/img/chatbot_picture.png"/><p class="botMsg">' + response_text[j] + '</p><div class="clearfix"></div>';
				$(BotResponse).appendTo(".chats").hide().fadeIn(1000);
			}
		}

		//check if the response contains "buttons" 
		if (response[i].hasOwnProperty("buttons")) {
			addSuggestion(response[i].buttons);
		}
		//only enable the text field again for user input if the message does not have buttons and is the last message from the bot
		else if (i == response.length - 1){
			$('.usrInput').attr("disabled",false);
		    $(".usrInput").prop('placeholder', "Type a message...");
		}
		
		scrollToBottomOfResults();
		
		if (i < response.length - 1){
			showBotTyping();
			$('.usrInput').attr("disabled",true);
			$(".usrInput").prop('placeholder', "Wait for DeliBot's response.");
		}
	}, summed_timeout);
}


//====================================== Suggestions ===========================================

function addSuggestion(textToAdd) {
	setTimeout(function () {
		$('.usrInput').attr("disabled",true);
		$(".usrInput").prop('placeholder', "Use one of the buttons to answer.");
		var suggestions = textToAdd;
		var suggLength = textToAdd.length;
		$(' <div class="singleCard"> <div class="suggestions"><div class="menu"></div></div></diV>').appendTo(".chats").hide().fadeIn(1000);
		// Loop through suggestions
		for (i = 0; i < suggLength; i++) {
			$('<div class="menuChips" data-payload=\'' + (suggestions[i].payload) + '\'>' + suggestions[i].title + "</div>").appendTo(".menu");
		}
		scrollToBottomOfResults();
	}, 1000);
}

// on click of suggestions, get the value and send to rasa
$(document).on("click", ".menu .menuChips", function () {
	$('.usrInput').attr("disabled",false);
	$(".usrInput").prop('placeholder', "Type a message...");
	var text = this.innerText;
	var payload = this.getAttribute('data-payload');
	console.log("payload: ", this.getAttribute('data-payload'))
	setUserResponse(text);
	send(payload);

	//delete the suggestions once user click on it
	$(".suggestions").remove();

});


//======================================bot typing animation ======================================
function showBotTyping() {

	var botTyping = '<img class="botAvatar" id="botAvatar" src="/img/chatbot_picture.png"/><div class="botTyping">' + '<div class="bounce1"></div>' + '<div class="bounce2"></div>' + '<div class="bounce3"></div>' + '</div>'
	$(botTyping).appendTo(".chats");
	$('.botTyping').show();
	scrollToBottomOfResults();
}

function hideBotTyping() {
	$('#botAvatar').remove();
	$('.botTyping').remove();
}
