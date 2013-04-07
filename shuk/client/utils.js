window.include_facebook = function(){
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '407750262605974', // App ID
      channelUrl : '//'+window.location.host+'/channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });
  };
  (function(d){
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     ref.parentNode.insertBefore(js, ref);
   }(document));  
}

/*GET TIMESTAMP*/
window.timestamp = function(){
  return new Date().getTime();  
}

window.popup = function(link, obj){
  window.open(link, 'popup', 'height='+obj.height+',width='+obj.width+',toolbar=1');
}
window.undef = function(obj){
 return typeof obj === 'undefined';
}
window.setModalMessage = function(title, body){
  $('.modal-header h3').html(title);
  $('.modal-body p').html(body);
}
window.log = function(args){
  if(typeof console !== 'undefined')
    console.log(args);
}