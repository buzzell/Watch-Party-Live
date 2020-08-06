const mediaSearch = {
    keyupTimer: null,
    search: function(){
        let listHTML = '', q = $('.searchBox input').val();
        clearTimeout(mediaSearch.keyupTimer);
        if(q == ""){
            $('.mediaList').removeClass('error').html('')
            $('body').removeClass('results')
            return
        }
        mediaSearch.keyupTimer = setTimeout(function(){
            $.getJSON( "search/"+encodeURI(q), function(data) {
                if(data.length){
                    data.forEach(i => {
                        i.date = (i.date) ? '<div class="date">' + moment(i.date).format('MMMM D, YYYY') + '</div>' : ""
                        let imgClass = (i.poster) ? "" : "null"
                        i.poster = (i.poster) ? i.poster : "https://watchparty.live/img/placeholder.svg"
                        let epiBtn = (i.type == "tv") ? `<a href="${i.type}/${i.id}/seasons" class="button-small pure-button">View Seasons</a>` : ""
                        listHTML += `
                            <div class="media">
                                <div class="poster ${imgClass}">
                                    <img src="${i.poster}">
                                </div>
                                <div class="info">
                                    <div class="title">${i.name}</div>
                                    ${i.date}
                                    <div class="overview">${i.overview}</div>
                                </div>
                                <div class="pure-button-group mediaBtnGrp ${i.type}" role="group" aria-label="...">
                                    ${epiBtn}
                                    <a href="${i.type}/${i.id}" class="button-small button-secondary pure-button">Join Public Chat</a>
                                    <a href="${i.type}/${i.id}/private" class="button-small button-success pure-button">Start Private Chat</a>
                                </div>
                        </div>`
                    })
                    $('body').addClass('results')
                    $('.mediaList').removeClass('error').html(listHTML)
                    window.scrollTo(0, 0)
                } else {
                    $('body').addClass('results')
                    $('.mediaList').addClass('error').html(`
                        <div class="errormsg">No movie or tv shows were found.</div>
                    `)
                }
            });
        }, 500);
    },
    init: function(){
        $(window).bind("pageshow", function() {
            if($('.searchBox input').val().trim() != ""){
                mediaSearch.search()
            }
        })
        $('.searchBox input').keyup(mediaSearch.search)
    }
}
mediaSearch.init()