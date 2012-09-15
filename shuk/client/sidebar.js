
Session.set('latestlists', null);

Template.latestlist.latest = function(argument) {
	return LatestLists.find( {},{sort:{when:-1}} );
};
Template.latestlist.events({
	'click li':function(e){
		playManager.setList(this._id);
	}	
});

Template.toptenlist.topten = function(argument) {
	return TopTenLists.find( {},{sort:{score:-1}} );
};
Template.toptenlist.events({
	'click li':function(e){
		playManager.setList(this._id);
	}	
});