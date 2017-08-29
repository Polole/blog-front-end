"use strict";
let app = new Templateify("http://localhost:5000", "/templates", "content");

(function(){
    class JWTAuth extends TemplateifyAuth {

        constructor(url, callbackUrl){
            super(url, callbackUrl)
        }

        loginCallback(username, password){
            return $.ajax({
                "contentType": "application/json",
                "type": "POST",
                "url": this.url,
                "data": JSON.stringify({"username": username, "password": password}),
                "dateType": "json"
            })
        }

        get token() {return this.user.access_token}

    }

    let jwtAuth = new JWTAuth(app.url("/auth"), "/")
    app.auth = jwtAuth;

    let indexSettings = {
        apiLocation: "/",
        callback: function(templateify, data){
            return {
                "posts": data
            }
        }
    }
    app.addTemplate("index", new TemplateifyTemplate("/", "index.html", indexSettings))

    let postSettings = {
        apiLocation: "/post",
        callback: function(templateify, data){
            return {
                "post": data
            }
        },
        urlConstructor: function(params){
            return this.apiLocation + "/" + params.id
        }
    }
    app.addTemplate("postView", new TemplateifyTemplate("/post/:id", "posts.html", postSettings))

    let createPostSettings = {
        apiLocation: "/post",
        requestMethod: "POST",
        callback: function(templateify){
            return {
                "loggedIn": templateify.auth.user ? true : false
            }
        },
        htmlInit: function(templateify){
            let self = this;
            let content = templateify.content;
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
                        "url": app.url(self.apiLocation),
                        "data": data,
                        "dataType": "json",
                        "beforeSend": function(xhr){xhr.setRequestHeader("Authorization", "JWT " + templateify.auth.token)}
                    })
                })
            }
            templateify.router.updatePageLinks()
        }
    }
    app.addTemplate("createPostView", new TemplateifyTemplate("/posts/create", "create_posts.html", createPostSettings))

    let loginSettings = {
        htmlInit: function(templateify){
            $('#login').click(function(){
                templateify.auth.login($('#username').val(), $('#password').val());
            })
            templateify.router.updatePageLinks();
        }
    }
    app.addTemplate("loginView", new TemplateifyTemplate("/login", "login.html", loginSettings))
})();

