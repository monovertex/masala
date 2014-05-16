
################################################################################
# Global variables
################################################################################
NODE_MODULES = ./node_modules/

LESS_BIN = lessc
SERVER_BIN = http-server
WR_BIN = wr
################################################################################

export PATH := ./node_modules/.bin:$(PATH)

################################################################################
# Miscellaneous variables
################################################################################
SERVER_PORT = 80
################################################################################

################################################################################
# Styles variables
################################################################################
STYLES_FOLDER = ./styles/
STYLES_FILES = $(STYLES_FOLDER)files.txt
STYLES_SRC_FOLDER = $(STYLES_FOLDER)src/
STYLES_BIN_FOLDER = $(STYLES_FOLDER)bin/
STYLES_LIB_FOLDER = $(STYLES_FOLDER)lib/
STYLES_SRC_APP = $(STYLES_SRC_FOLDER)app.less
STYLES_SRC_OUT = $(STYLES_SRC_FOLDER)app.css
STYLES_BIN = $(STYLES_BIN_FOLDER)app.css
################################################################################

.PHONY: styles watch clean

################################################################################

build: clean styles

################################################################################

styles:
	$(LESS_BIN) "$(STYLES_SRC_APP)" > "$(STYLES_SRC_OUT)"
	sed 's:^:$(STYLES_FOLDER):' $(STYLES_FILES) \
		| xargs cat > $(STYLES_BIN)

	rm $(STYLES_SRC_OUT)

################################################################################

watch-styles:
	$(WR_BIN) "make styles" $(STYLES_SRC_FOLDER)

################################################################################

server:
	$(SERVER_BIN) -p $(SERVER_PORT) .

################################################################################

clean:
	rm -rf $(STYLES_BIN)

################################################################################