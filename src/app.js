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

blog.API_URL = "http://localhost:5000";
blog.content = null;
blog.router = new Navigo(window.location.origin + "/");
blog.loginStatus = false;
blog.xhr = false;
blog.missingTemplate = null;
blog.createTemplateSkeleton = function(templateLocation, options){
    if(!options){
        options = {};
    }
    let object = {
        "data": null,
        "location": "/templates/" + templateLocation,
        "api": null,
        "urlConstructor": function(params){ return this.api },
        "callback": function(blog){ return {} },
        "htmlInit": function(blog){ blog.router.updatePageLinks(); return true; },
        "requestMethod": options.requestMethod ? options.requestMethod : "GET",
        "settings": {}
    };
    if(options.apiLocation){
        object["api"] = this.API_URL + options.apiLocation;
    };
    if(options.settings){
        object["settings"] = options.settings
    }
    return object
};

blog.getRestOfTemplates = function(){
    let self = this;
    for(let property in this.templates){
        if(!this.templates.hasOwnProperty(property)) continue;
        let template = this.templates[property];
        if(template.location != blog.firstTemplate){
            $.get(template.location, function(data){
                template.data = data;
                if(self.missingTemplate){
                    if(template.location == self.missingTemplate.location){
                        self.changeContent(property, self.missingTemplate.params);
                        self.missingTemplate = false;
                    }
                }
            });
        };
    }
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
    let template = this.templates[templateLocation]
    if(template){
        blog.firstTemplate = template.location;
        $.get(template.location, function(data){
            template.data = data
            self.initializeRoutes();
        });
    } else {
        self.initializeRoutes();
    }
};

blog.abortXhr = function(){
    this.xhr && this.xhr.abort();
    this.xhr = null;
}

blog.doRender = function(template, data){
    if(data){
        this.content.html(nunjucks.renderString(template.data, template.callback(this, data)))
    } else {
        this.content.html(nunjucks.renderString(template.data, template.callback(this)))
    }
    template.htmlInit(this)
    this.content.fadeIn();
}

blog.changeContent = function(templateLocation, params){
    let template = this.templates[templateLocation];
    let self = this;
    this.content.hide();
    if(template.data){
        this.abortXhr();
        let getUrl = template.urlConstructor(params);
        if(getUrl && template.requestMethod == "GET"){
            this.xhr = $.get(getUrl, function(data){
                self.doRender(template, data)
            });
        } else {
            this.doRender(template)
        };
    } else {
        this.missingTemplate = {
            "location": template.location,
            "params": null
        };
        if(params){
            this.missingTemplate["params"] = params;
        };
    };
};

blog.initializeRoutes = function(){
    let self = this;
    this.router.notFound(function(){
        self.content.html("Not found!");
    })
    this.router.on(this.routes).resolve();
};

(function(blog){
    let indexSettings = {
        "apiLocation": "/"
    }
    let indexTemplate = blog.createTemplateSkeleton(
        "index.html",
        indexSettings
    );
    indexTemplate.callback = function(blog, object){
        return {
            "posts": object
        };
    };
    let postSettings = {
        "apiLocation": "/post"
    }
    let postTemplate = blog.createTemplateSkeleton(
        "posts.html",
        postSettings
    )
    postTemplate.callback = function(blog, object){
        return {
            "post": object
        }
    }
    postTemplate.urlConstructor = function(params){
        return this.api + "/" + params.id;
    }
    let createPostsSettings = {
        "apiLocation": "/post",
        "requestMethod": "POST"
    }
    let createPostsTemplate = blog.createTemplateSkeleton(
        "create_posts.html",
        createPostSettings
    );
    createPostsTemplate.callback = function(blog){
        return {
            "loggedIn": blog.loginStatus
        };
    };
    createPostsTemplate.htmlInit = function(blog){
        let self = this;
        let content = blog.content;
        if(content.find('#editor').length){
            CKEDITOR.replace('editor')
            content.find('#submit').click(function(event){
                let data = JSON.stringify({
                    "title": "Some Title",
                    "content": CKEDITOR.instances.editor.getData()
                })
                $.ajax({
                    "contentType": "application/json",
                    "type": self.requestMethod,
                    "url": self.api,
                    "data": data,
                    "dataType": "json"
                })
            })
        }
        blog.router.updatePageLinks();
    }
    blog.templates = makeIterable({
        "/": indexTemplate,
        "/post": postTemplate,
        "/posts/create": createPostsTemplate
    });
    blog.regexMap = makeIterable({
        "/post/.+": "/post"
    })
})(blog);

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

$(document).ready(function(){
    nunjucks.configure({"autoescape": true})
    blog.content = $('#content');
    blog.getFirstTemplate();
    blog.getRestOfTemplates();
})
