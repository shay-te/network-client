let postFields = ["title", "content"];
let commentFields = ["title", "content"];
let prepareData = function(data, fields) {
    let result = {};
    for(let i in fields) {
        let field = fields[i];
        if(data.hasOwnProperty(field)) {
            result[field] = data[field];
        }
    }
    return result;
}


let DataError = require('./DataError.js');


module.exports = {
    posts: {},
    comments: {},
    postsToComments: {},
    maxPostId: 0,
    maxCommentId: 0,

    allPosts: function() {
        return Object.values(this.posts);
    },
    addPost: function(data) {
        this._validateData(data);
        this.maxPostId++;
        let postId = this.maxPostId;
        this.posts[postId] = prepareData(data, postFields);
        this.postsToComments[postId] = [];
        return postId;
    },
    deletePost: function(postId) {
        this._validatePostExists(postId);
        delete this.posts[postId];
        delete this.postsToComments[postId]
    },
    updatePost: function(postId, data) {
        this._validateData(data);
        this._validatePostExists(postId);
        this.posts[postId] = Object.assign(this.posts[postId], prepareData(data, postFields));
    },
    getPost: function(postId) {
        this._validatePostExists(postId);
        return this.posts[postId];
    },

    addComment: function(postId, data) {
        this._validateData(data);
        this._validatePostExists(postId);

        this.maxCommentId++;
        this.postsToComments[postId].push(this.maxCommentId);
        this.comments[this.maxCommentId] = prepareData(data, commentFields);
        return this.maxCommentId;
    },
    deleteComment: function(postId, commentId) {
        this._validateCommentExists(postId, commentId);

        delete this.comments[commentId];
    },
    updateComment: function(postId, commentId, data) {
        this._validateData(data);
        this._validateCommentExists(postId, commentId);

        this.comments[commentId] = Object.assign(this.comments[commentId], prepareData(data, commentFields));
    },
    getComment: function(postId, commentId) {
        this._validateCommentExists(postId, commentId);
        return this.comments[commentId];
    },
    _validateData: function(data) {
        if(!data || data.constructor !== Object) {throw new DataError(500, "Data must be set")}
    },
    _validatePostExists: function(postId) {
        if(!this.posts[postId]) {throw new DataError(404, "Not found")};
    },
    _validateCommentExists: function(postId, commentId) {
        if(!this.posts[postId]) {throw new DataError(404, "Not found")};
        if(!this.comments[commentId] || this.postsToComments[postId].indexOf(commentId) != -1) {throw new DataError(404, "Not found")};
    },

}