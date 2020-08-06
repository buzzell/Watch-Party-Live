module.exports = (express) => {
    const router = express.Router();
    const request = require('request');
    const { v4: uuidv4 } = require('uuid');
    const key = "d2efe717afb56d41d46f5de0d8831a8e"

    router.get("/", (req, res) => {
        res.render("search");
    });

    router.get(["/:type(tv|movie|season|episode)/:id([-0-9]+)", "/:type(tv|movie|season|episode)/:id([-0-9]+)/:uuid([-a-zA-Z0-9]{36})"], (req, res, next) => {
        let type = req.params.type
        let id = req.params.id
        let roomkey = (req.params.uuid) ? "/"+req.params.uuid : ""
        if (type == "movie") {
            movieURL = "https://api.themoviedb.org/3/movie/"+id+"?api_key="+key+"&language=en-US&append_to_response=release_dates"
            request(movieURL, {json: true}, (error, JSONres, body) => {
                if(body.status_code == 34){
                    var err = new Error('Not Found');
                    err.status = 404;
                    return next(err);
                }
                res.render("chat", {id: id, type: type, data: formatTvorMovie(body, type), key: roomkey, attrib: "https://themoviedb.org/movie/"+id})
            })
        } else if(type == "tv" || type == "season" || type == "episode") {
            [tvID, seasonNum, episodeNum] = id.split("-")
            tvURL = "https://api.themoviedb.org/3/tv/"+id+"?api_key="+key+"&language=en-US&append_to_response=content_ratings"
            request(tvURL, {json: true}, (error, JSONres, body) => {
                if(body.status_code == 34){
                    var err = new Error('Not Found');
                    err.status = 404;
                    return next(err);
                }
                let tvData = formatTvorMovie(body, type)
                if(type == "season" || type == "episode"){
                    seasonURL = "https://api.themoviedb.org/3/tv/"+tvID+"/season/"+seasonNum+"?api_key="+key+"&language=en-US"
                    request(seasonURL, {json: true}, (error, JSONres, body) => {
                        if(body.status_code == 34){
                            var err = new Error('Not Found');
                            err.status = 404;
                            return next(err);
                        }
                        let [y,m,d] = body.air_date.split('-')
                        let seasonData = {
                            name: body.name,
                            season_number: body.season_number
                        }
                        tvData.poster = body.poster_path
                        tvData.release_date = m+"/"+d+"/"+y
                        tvData.overview = body.overview
                        if(type == "episode"){
                            episodeURL = "https://api.themoviedb.org/3/tv/"+tvID+"/season/"+seasonNum+"/episode/"+episodeNum+"?api_key="+key+"&language=en-US"
                            request(episodeURL, {json: true}, (error, JSONres, body) => {
                                if(body.status_code == 34){
                                    var err = new Error('Not Found');
                                    err.status = 404;
                                    return next(err);
                                }
                                let [y,m,d] = body.air_date.split('-')
                                let episodeData = {
                                    name: body.name,
                                    episode_number: body.episode_number
                                }
                                tvData.poster = body.still_path
                                tvData.release_date = m+"/"+d+"/"+y
                                tvData.overview = body.overview
                                res.render("chat", {id: id, type: type, data: tvData, season: seasonData, episode: episodeData, key: roomkey, attrib: "https://themoviedb.org/tv/"+tvID+"/season/"+seasonData.season_number+"/episode/"+episodeData.episode_number})  
                            })
                        }else{
                            res.render("chat", {id: id, type: type, data: tvData, season: seasonData, key: roomkey,  attrib: "https://themoviedb.org/tv/"+tvID+"/season/"+seasonData.season_number})  
                        }
                    })
                }else {
                    res.render("chat", {id: id, type: type, data: tvData, key: roomkey, attrib: "https://themoviedb.org/tv/"+id})
                }
            })
        }
    })

    router.get("/:type(tv|movie|season|episode)/:id/private", (req, res) => {
        res.redirect("/" + req.params.type + "/" + req.params.id + "/" + uuidv4())
    });

    router.get("/tv/:id/seasons", (req, res) => {
        let tvShow = "https://api.themoviedb.org/3/tv/"+req.params.id+"?api_key="+key+"&language=en-US"
        request(tvShow, {json: true}, (error, JSONres, body) => {
            if(body.seasons[0].episode_count ==  0) body.seasons.shift()
            res.render("episodes", {data: body});
        })
    });

    router.get("/tv/:id/:seasonNum/episodes", (req, res) => {
        let tvSeason = "https://api.themoviedb.org/3/tv/"+req.params.id+"/season/"+req.params.seasonNum+"?api_key="+key+"&language=en-US"
        request(tvSeason, {json: true}, (error, JSONres, body) => {
            res.json(body);
        })
    });

    router.get('/search/:q', function (req, res) {
        searchURL = "https://api.themoviedb.org/3/search/multi?api_key="+key+"&language=en-US&query="+req.params.q+"&page=1&include_adult=false"
        request(searchURL, {json: true}, (error, JSONres, body) => {
            var ixn = 0
            var returnjson = new Array();
            body.results.forEach(i => {
                if (ixn==20) return false;
                if (i.media_type == "person") return;
                let name = (i.name) ? i.name : i.title
                returnjson.push({
                    'id': i.id,
                    'poster': (i.poster_path) ? "https://image.tmdb.org/t/p/w500"+i.poster_path : null,
                    'type': i.media_type,
                    'name': name,
                    'overview': i.overview,
                    'date': (i.first_air_date) ? i.first_air_date : i.release_date
                })
                ixn++
            })
            res.json(returnjson)
        });
    });

    function formatTvorMovie(data, type){
        let runtime, rating, country, content_ratings
        if(type == "movie") {
            country = (data.production_countries[0]) ? data.production_countries[0].iso_3166_1 : ""
            content_ratings = data.release_dates.results
        } else {
            country = (data.origin_country) ? data.origin_country[0] : ""
            content_ratings = data.content_ratings.results
        }
        if(country != ""){    
            content_ratings.forEach(i => {
                if(i.iso_3166_1 == country){ 
                    if(type == "movie"){
                        i.release_dates.forEach(i => {
                            if(i.certification != ""){
                                rating = i.certification
                                return
                            }
                        })
                    } else {
                        rating = i.rating
                    }
                }
            })
            if(!rating) rating = "NR"
        }else{
            rating = "NR"
        }
        data.runtime = (data.episode_run_time) ? data.episode_run_time[0] : data.runtime
        if(data.runtime > 59){
            let h = Math.floor(data.runtime / 60)
            let m = data.runtime - (h * 60) 
            if(m>0) {
                m = " "+m+"m"
            }else {
                m = ""
            }
            runtime = h+"h" + m
        }else {
            runtime = data.runtime+"m"
        }
        let [y,m,d] = (data.first_air_date) ? data.first_air_date.split('-') : data.release_date.split('-')
        let release_date = m+"/"+d+"/"+y
        return {
            title: (data.title) ? data.title : data.name,
            poster: data.poster_path,
            release_date: release_date,
            year: y,
            runtime: runtime,
            overview: data.overview,
            rating: rating,
            country: country
        }
    }

    return router;
}