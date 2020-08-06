const episodes = {
    tvID: $('body').attr('data-id'),
    seasonList: new Array(parseInt($('body').attr('data-num_of_seasons'))),
    showEpisodes: function(e){
        e.preventDefault()
        let epiBtn = $(this)
        let episodeListElem = epiBtn.parents('.seasonBtnGrp').siblings('.episodeList')
        $('.toggleEpisodes').text('View Episodes').off("click").on("click", episodes.showEpisodes)
        $('.episodeList').slideUp()
        epiBtn.text('Hide Episodes').off("click")
        if(episodes.seasonList[epiBtn.attr('data-seasonNum')]){
            episodeListElem.slideDown()
            epiBtn.on("click", episodes.hideEpisodes)
        }else{
            episodes.getEpisodes(episodeListElem, epiBtn, epiBtn.attr('data-seasonNum'))
        }
    },
    hideEpisodes: function(e){
        e.preventDefault()
        let episodeListElem = $(this).parents('.seasonBtnGrp').siblings('.episodeList')
        episodeListElem.slideUp()
        $(this).off('click').on('click', episodes.showEpisodes).text('View Episodes')
    },
    getEpisodes: function(episodeListElem, epiBtn, seasonNum){
        $.getJSON( "/tv/"+episodes.tvID+"/"+seasonNum+"/episodes", function( data ) {
            let epiListHtml = ""
            data.episodes.forEach(i => {
                let imgClass = (i.still_path) ? "" : "null"
                i.still_path = (i.still_path) ? "https://image.tmdb.org/t/p/w200"+i.still_path : "https://watchparty.live/img/placeholder.svg"
                epiListHtml += `
                    <li class="episode">
                        <div class="epiNum">${i.episode_number}</div>
                        <div class="epiStill ${imgClass}">
                            <img src="${i.still_path}">
                        </div>
                        <div class="epiName">${i.name}</div>
                        <div class="pure-button-group episodeBtnGrp" role="group" aria-label="...">
                            <a class="button-small button-secondary pure-button" href="/episode/${episodes.tvID}-${seasonNum}-${i.episode_number}">Join Public Chat</a>
                            <a class="button-small button-success pure-button" href="/episode/${episodes.tvID}-${seasonNum}-${i.episode_number}/private">Start Private Chat</a>
                        </div>
                    </li>
                `
            })
            episodes.seasonList[seasonNum] = true
            episodeListElem.html(epiListHtml).slideDown()
            epiBtn.on("click", episodes.hideEpisodes)
        })
    },
    init: function(){
        $('.date').each(function(e) {
            $(this).text(moment($(this).text()).format('MMMM D, YYYY'))
        })
        $('.toggleEpisodes').on("click", episodes.showEpisodes)
    }
}
episodes.init()