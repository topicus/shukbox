Session.set('recents', null);

Template.recentlist.recents = function(argument) {
	if(typeof(error) ==='undefined') return Session.get('recents');
	return false;
};
Template.recentlist.events = {
	'click li':function(e){
		playManager.setList(this._id);
	}	
};
getRecentsLists();
function getRecentsLists(){
	Meteor.call('getRecentsLists', function(error, response){
		Session.set('recents', response);
	});
};