"use strict";
let makeIterable = function(object){
    object[Symbol.iterator] = function *(){
        let names = Object.getOwnPropertyNames(this);
        let i = 0;
        while(i < names.length){
            yield this[names[i]];
            i++;
        }
    }
    return object
}

let blog = makeIterable({})

blog.API_URL = "http://localhost:5000"
blog.content = null;
blog.router = new Navigo("http://localhost/");
blog.loginStatus = false;
blog.xhr = false;
blog.createTemplateSkeleton = function(templateLocation, apiLocation){
    let object = {
        "data": null,
        "location": "/templates/" + templateLocation,
        "api": null
    };
    if(apiLocation){
        object["api"] = this.API_URL + apiLocation;
    };
    return object
};
(function(blog){
    let indexTemplate = blog.createTemplateSkeleton(
        "index.html",
        "/"
    );
    indexTemplate.callback = function(blog, object){
        return {
            "posts": object
        };
    };
    let postTemplate = blog.createTemplateSkeleton(
        "posts.html",
        "/post"
    )
    postTemplate.callback = function(blog, object){
        return {
            "post": object
        }
    }
    postTemplate.params = function(params){
        return params.id;
    }
    let createPostsTemplate = blog.createTemplateSkeleton(
        "create_posts.html",
        null
    );
    createPostsTemplate.callback = function(blog){
        return {
            "loggedIn": blog.loginStatus
        };
    };
    blog.templates = makeIterable({
        "/": indexTemplate,
        "/post": postTemplate,
        "/posts/create": createPostsTemplate
    });
    blog.regexMap = makeIterable({
        "/post/.+": "/post"
    })
})(blog);

blog.getRestOfTemplates = function(){
    let self = this;
    for(let template of this.templates){
        if(template.location != blog.firstTemplate){
            $.get(template.location, function(data){
                template.data = data;
            });
        };
    };
};

blog.getFirstTemplate = function(){
    let self = this;
    let templateLocation = null;
    for(var regex in this.regexMap){
        if(!this.regexMap.hasOwnProperty(regex)) continue;
        let regexp = new RegExp(regex);
        if(regexp.test(window.location.pathname)){
            templateLocation = this.regexMap[regex];
        }
    }
    if(!templateLocation){
        templateLocation = window.location.pathname;
    }
    console.log(templateLocation)
    let template = this.templates[templateLocation]
    if(template){
        blog.firstTemplate = template.location;
        $.get(template.location, function(data){
            template.data = data
            self.router.resume();
            self.router.navigate(window.location.pathname);
        });
    } else {
        self.router.resume();
        self.router.navigate(window.location.pathname);
    }
};

blog.routes = {
    "/":{
        as: 'index',
        uses: function(){
            blog.changeContent("/");
        }
    },
    "/post/:id": {
        as: 'posts.view',
        uses: function(params){
            blog.changeContent("/post", params)
        }
    },
    "/posts/create":{
        as: 'posts.create',
        uses: function(){
            blog.changeContent("/posts/create");
        }
    }
}

blog.changeContent = function(templateLocation, params){
    let template = this.templates[templateLocation]
    let self = this;
    if(this.content){
        if(blog.xhr){
            blog.xhr.abort()
            blog.xhr = null;
        }
        let getUrl = template.api
        if(getUrl){
            if(params){
                getUrl = getUrl + "/" + template.params(params);
            }
            blog.xhr = $.get(getUrl, function(data){
                self.content.html(nunjucks.renderString(template.data, template.callback(self, data)));
            })
        } else {
            self.content.html(nunjucks.renderString(template.data, template.callback(self)))
        }
    } else {
        throw Error("Content did not exist at this time.");
    }
}

blog.initializeRoutes = function(){
    let self = this;
    this.router.notFound(function(){
        self.content.html("Not found!");
    })
    this.router.on(this.routes).resolve();
}

$(document).ready(function(){
    nunjucks.configure({"autoescape": true})
    blog.content = $('#content');
    blog.router.pause();
    blog.initializeRoutes();
    blog.getFirstTemplate();
    blog.getRestOfTemplates();
})
