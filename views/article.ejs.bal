<%- include header %>
<p>
    <% if(user && (user.name == post.name)) { %>
        <span><a class="edit" href="/edit/<%= post.name %>/<%= post.time.day %>/<%= post.title %>">Edit</a></span>
        <span><a class="edit" href="/remove/<%= post.name %>/<%= post.time.day %>/<%= post.title %>">Remove</a></span>
    <% }%>
    <% var flag = 1 %>
    <% if(user && (user.name != post.name)) { %>
        <% if((post.reprint_info.reprint_from != undefined) && (user.name == post.reprint_info.reprint_from.name)) { %>
            <% var flag = 0 %>
        <% } %>
        <% if((post.reprint_info.reprint_to != undefined)) { %>
            <% post.reprint_info.reprint_to.forEach(function(reprint_to, index) { %>
                <% if(user.name == reprint_to.name) { %>
                    <% flag = 0 %>
                <% } %>
            <% }) %>
        <% } %>
    <% }else{ %>
        <% flag = 0 %>
    <% } %>
    <% if(flag) %>
        <span><a class="edit" href="/reprint/<%= post.name %>/<%= post.time.day %>/<%= post.title %>">Reprint</a></span>
    <% } %>
</p>
<p class="info">
    Author: <a href="/u/<%= post.name %>"><%= post.name %></a> |
    Date: <%= post.time.minute %>
    <!--<% if(post.reprint_info.reprint_from) { %>
        <br><a href="<%= post.reprint_info.reprint_from.name %>/<%= post.reprint_info.reprint_from.reprint.day %>/<%= post.reprint_info.reprint_from.title %>">Description link</a>
    <% } %>-->
</p>
<p><%- post.post %></p>
<p class="info">Read: <%= post.pv %> | Comments: <%= post.comments.length %></p>
<%- include comment %>
<%- include footer %>
