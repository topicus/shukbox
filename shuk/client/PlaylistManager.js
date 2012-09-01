(function(window){

	function PlaylistManager(){
		var that = this;
		this.newList = function(temp){
			saved = typeof temp !== 'undefined' ? temp : false;
			if(Meteor.user()){
			    var name = 'Untitled-list';
			    Meteor.call('addPlaylist', {name:name, user:Meteor.user()._id,saved:saved, blocked:false}, function(error,response){
			      Session.set('listkey',response);
			      that.newChannel();
			    });    
			}
		};
		this.setList = function(listkey){
			that.newChannel(listkey)
		};		
		this.newChannel = function(listkey){
		    if(Meteor.user() && listkey){
			    Meteor.call('addPlaychannel', {playlist:listkey, user:Meteor.user()._id, current:Session.get('current')}, function(error,response){
			      Session.set('listkey', listkey);
			      Session.set('owner', Meteor.user()._id);
			      Router.setList(response);

			    });
			}			
		};			
	}
	window.PlaylistManager = PlaylistManager;
})(window);