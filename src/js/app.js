"use strict";
let app = new Templateify("http://localhost:3000", "/templates", "content");

(function(){
    class JWTAuth extends TemplateifyAuth {

        constructor(url, callbackUrl){
            super(url, callbackUrl)
        }

        loginCallback(email, password){
            return $.ajax({
                "contentType": "application/json",
                "type": "POST",
                "url": this.url,
                "data": JSON.stringify({"email": email, "password": password}),
                "dateType": "json"
            })
        }

        authHeaders(){
            let self = this;
            return function(xhr){
                xhr.setRequestHeader("Authorization", `JWT ${self.token}`)
            }
        }

        get token() {return this.data && this.data.auth_token}

    }

    let parentTemplate = new TemplateifyTemplate(null, "main.html", {})
    app.parentTemplate = parentTemplate;

    let jwtAuth = new JWTAuth(app.url("/auth/login"), "/")
    app.auth = jwtAuth;

    let indexSettings = {
        apiLocation: "/posts",
        callback: function(templateify, data){
            return {
                "posts": data
            }
        }
    }
    app.addTemplate("index", new TemplateifyTemplate("/", "index.html", indexSettings))

    let postSettings = {
        apiLocation: "/posts",
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
        apiLocation: "/posts",
        requestMethod: "POST",
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
                    let requestOptions = {
                        data: data,
                        type: self.requestMethod
                    }
                    templateify.requestWithAuth(self.apiLocation, requestOptions).then(function(data){
                        templateify.navigateByViewName("postView", {"id": data.id})
                    })
                })
            }
        }
    }
    app.addTemplate("createPostView", new TemplateifyTemplate("/posts/create", "create_posts.html", createPostSettings))

    let loginSettings = {
        htmlInit: function(templateify){
            $('#login').click(function(){
                templateify.auth.login($('#username').val(), $('#password').val());
            })
        }
    }
    app.addTemplate("loginView", new TemplateifyTemplate("/login", "login.html", loginSettings))

    let logoutSettings = {
        htmlInit: function(templateify){
            templateify.auth.logout();
            templateify.router.navigate("/");
        }
    }
    app.addTemplate("logoutView", new TemplateifyTemplate("/logout", null, logoutSettings))
})();

