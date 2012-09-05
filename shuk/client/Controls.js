(function(window){

  function Controls(){
    var that = this;
    this.playSong = function(vid){
        if(typeof(player)==='undefined' || !player){
          player = new YT.Player('player-div', {
            height: '300',
            width: '100%',
            videoId: vid,
            playerVars: { 'autoplay': 0, 'wmode': 'opaque' }, 
            events: {
              'onReady': function(event){
                player.playVideo();
              },
              'onStateChange': that.onPlayerStateChange
            }
          });
        }else if(player){
          player.loadVideoById(vid);
          player.playVideo();      
        }
    };
    this.onPlayerStateChange = function(event) {
      if(event.data==YT.PlayerState.ENDED){
        that.nextSong();  
      }
    };
    this.stopVideo = function() {
      if(player){
        player.stopVideo();
        player.destroy();    
      }
      player = null;
    };  
    this.nextSong = function(){
      that.setCurrent('modify',1);
      var c = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[Session.get('current')];
      if(c)
        that.playSong(c.name);
      else {
        if(Session.get('repeat')){
          that.setCurrent('set',0);
          c = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[Session.get('current')];
          that.playSong(c.name);
        }
      }
    };
    this.setCurrent = function(m,i){
      old_current = current;
      if(m=='modify'){
        Session.set('current', Session.get('current') + i);
      }else if(m=='set'){
        Session.set('current', i);
      } 
      if(Session.get('playchannel') ){
        PlayChannels.update({_id:Session.get('playchannel')}, { $set: { current : Session.get('current') }} );    
      }
    };
  }

  window.Controls = Controls;
})(window);