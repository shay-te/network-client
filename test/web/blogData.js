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


class DataError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}


module.exports {
    posts: {},
    comments: {},
    postsToComments: {},
    maxPostId: 0,
    maxCommentId: 0,

    addPost: function(data) {
        this.maxPostId++;
        this.posts[this.maxPostId] = prepareData(data, postFields);
        this.postsToComments[postId] = [];
        return this.maxPostId;
    },
    deletePost: function(postId) {
        this._validatePostExists(postId);
        delete this.posts[postId];
        delete this.postsToComments[postId]
    },
    updatePost: function(postId, data) {
        this._validatePostExists(postId);
        this.posts[postId] = Object.assign(this.posts[postId], prepareData(data, postFields));
    },
    getPost: function(postId) {
        this._validatePostExists(postId);
        return this.posts[postId];
    },
    getPosts: function() {
        return this.posts;
    },

    addComment: function(postId, data) {
        this._validatePostExists(postId);

        this.maxCommentId++;
        this.postsToComments.push(this.maxCommentId);
        this.comments[this.maxCommentId] = prepareData(data, commentFields);
        return this.maxCommentId;
    },
    deleteComment: function(postId, commentId) {
        this._validateCommentExists(postId, commentId);

        delete this.comments[commentId];
    },
    updateComment: function(postId, commentId, data) {
        this._validateCommentExists(postId, commentId);

        this.comments[commentId] = Object,assign(this.comments[commentId], prepareData(data, commentFields));
    },
    getComment: function(postId, commentId) {
        this._validateCommentExists(postId, commentId);
        return this.comments[commentId];
    },

    _validatePostExists = function(postId) {
        if(!this.posts[postId]) {throw new DataError(404, "Not found")};
    },
    _validateCommentExists = function(postId, commentId) {
        if(!this.posts[postId]) {throw new DataError(404, "Not found")};
        if(!this.comments[commentId] || this.postsToComments[postId].indexOf(commentId) != -1) {throw new DataError(404, "Not found")};
    },

}