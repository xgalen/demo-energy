DOCS = docs/*.md
REPORTER = dot
default: @ 

test:
	@NODE_ENV=test ./node_modules/.bin/mocha -b \
		--reporter $(REPORTER)

test-cov: lib-cov
	@DEMO_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	rm -rf $@
	@jscoverage lib $@

.PHONY: test test-cov
