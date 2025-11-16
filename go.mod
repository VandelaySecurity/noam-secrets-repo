module github.com/myuser/myproject

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/some/package v1.2.3
)

replace github.com/some/package => github.com/blah/package v1.2.4
