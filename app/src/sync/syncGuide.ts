import {needSubscribe} from "../util/needSubscribe";
import {showMessage} from "../dialog/message";
import {fetchPost} from "../util/fetch";
import {Dialog} from "../dialog";
import {confirmDialog} from "../dialog/confirmDialog";
import {isMobile} from "../util/functions";

export const addCloudName = (cloudPanelElement: Element) => {
    const dialog = new Dialog({
        title: window.siyuan.languages.cloudSyncDir,
        content: `<div class="b3-dialog__content">
    <input class="b3-text-field fn__block" value="main">
    <div class="b3-label__text">${window.siyuan.languages.reposTip}</div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${window.siyuan.languages.confirm}</button>
</div>`,
        width: isMobile() ? "80vw" : "520px",
    });
    const inputElement = dialog.element.querySelector("input") as HTMLInputElement;
    const btnsElement = dialog.element.querySelectorAll(".b3-button");
    dialog.bindInput(inputElement, () => {
        (btnsElement[1] as HTMLButtonElement).click();
    });
    inputElement.focus();
    inputElement.select();
    btnsElement[0].addEventListener("click", () => {
        dialog.destroy();
    });
    btnsElement[1].addEventListener("click", () => {
        cloudPanelElement.innerHTML = '<img style="margin: 0 auto;display: block;width: 64px;height: 100%" src="/stage/loading-pure.svg">'
        fetchPost("/api/sync/createCloudSyncDir", {name: inputElement.value}, () => {
            dialog.destroy();
            getSyncCloudList(cloudPanelElement, true);
        });
    });
};

export const bindSyncCloudListEvent = (cloudPanelElement: Element) => {
    cloudPanelElement.addEventListener("click", (event) => {
        let target = event.target as HTMLElement;
        while (target && !target.isEqualNode(cloudPanelElement)) {
            const type = target.getAttribute("data-type");
            if (type) {
                switch (type) {
                    case "addCloud":
                        addCloudName(cloudPanelElement);
                        break;
                    case "removeCloud":
                        confirmDialog(window.siyuan.languages.confirm, `${window.siyuan.languages.confirmDeleteCloudDir} <i>${target.parentElement.getAttribute("data-name")}</i>`, () => {
                            cloudPanelElement.innerHTML = '<img style="margin: 0 auto;display: block;width: 64px;height: 100%" src="/stage/loading-pure.svg">'
                            fetchPost("/api/sync/removeCloudSyncDir", {name: target.parentElement.getAttribute("data-name")}, (response) => {
                                window.siyuan.config.sync.cloudName = response.data;
                                getSyncCloudList(cloudPanelElement, true);
                            });
                        });
                        break;
                    case "selectCloud":
                        cloudPanelElement.innerHTML = '<img style="margin: 0 auto;display: block;width: 64px;height: 100%" src="/stage/loading-pure.svg">'
                        fetchPost("/api/sync/setCloudSyncDir", {name: target.getAttribute("data-name")}, () => {
                            window.siyuan.config.sync.cloudName = target.getAttribute("data-name");
                            getSyncCloudList(cloudPanelElement, true);
                        });
                        break;
                }
                event.preventDefault();
                event.stopPropagation();
                break;
            }
            target = target.parentElement;
        }
    });
};

export const getSyncCloudList = (cloudPanelElement: Element, reload = false) => {
    if (!reload && cloudPanelElement.firstElementChild.tagName !== "IMG") {
        return;
    }
    fetchPost("/api/sync/listCloudSyncDir", {}, (response) => {
        let syncListHTML = `<div class="fn__hr"></div><ul><li style="padding: 0 16px" class="b3-list--empty">${window.siyuan.languages.emptyCloudSyncList}</li></ul>`;
        if (response.code !== 1) {
            syncListHTML = '<div class="fn__hr"></div><ul class="b3-list b3-list--background fn__flex-1" style="overflow: auto;">';
            response.data.syncDirs.forEach((item: { hSize: string, cloudName: string, updated: string }) => {
                syncListHTML += `<li data-type="selectCloud" data-name="${item.cloudName}" class="b3-list-item b3-list-item--hide-action">
<input type="radio" name="cloudName"${item.cloudName === response.data.checkedSyncDir ? " checked" : ""}/>
<span class="fn__space"></span>
<span>${item.cloudName}</span>
<span class="fn__space"></span>
<span class="ft__on-surface">${item.hSize}</span>
<span class="b3-list-item__meta">${item.updated}</span>
<span class="fn__flex-1 fn__space"></span>
<span data-type="removeCloud" class="b3-tooltips b3-tooltips__w b3-list-item__action" aria-label="${window.siyuan.languages.delete}">
    <svg><use xlink:href="#iconTrashcan"></use></svg>
</span></li>`;
            });
            syncListHTML += `</ul>
<div class="fn__hr"></div>
<div class="fn__flex">
    <div class="fn__flex-1"></div>
    <button class="b3-button b3-button--outline" data-type="addCloud"><svg><use xlink:href="#iconAdd"></use></svg>${window.siyuan.languages.addAttr}</button>
</div>`;
        }
        cloudPanelElement.innerHTML = syncListHTML;
    });
};

export const syncGuide = (element?: Element) => {
    if (needSubscribe() || (element && element.classList.contains("fn__rotate"))) {
        return;
    }
    if (!window.siyuan.config.repo.key) {
        setKey();
        return;
    }
    if (!window.siyuan.config.sync.enabled) {
        setSync();
        return;
    }
    fetchPost("/api/sync/performSync", {});
}

const setSync = (key?: string, dialog?: Dialog) => {
    if (key) {
        window.siyuan.config.repo.key = key;
    }
    if (!window.siyuan.config.sync.enabled) {
        const listHTML = `<div class="b3-dialog__content" style="display: flex;flex-direction: column;height: 40vh;">
    <img style="margin: 0 auto;display: block;width: 64px;height: 100%" src="/stage/loading-pure.svg">
</div>
<div class="b3-dialog__action">
    <button class="b3-button">${window.siyuan.languages.openSyncTip1}</button>
</div>`
        if (dialog) {
            dialog.element.querySelector(".b3-dialog__container").lastElementChild.innerHTML = listHTML;
        } else {
            dialog = new Dialog({
                title: window.siyuan.languages.cloudSyncDir,
                content: listHTML,
                width: isMobile() ? "80vw" : "520px",
            });
        }
        const contentElement = dialog.element.querySelector(".b3-dialog__content")
        bindSyncCloudListEvent(contentElement);
        getSyncCloudList(contentElement);
        dialog.element.querySelector(".b3-button").addEventListener("click", () => {
            dialog.destroy()
            fetchPost("/api/sync/setSyncEnable", {enabled: true}, (response) => {
                if (response.code === 1) {
                    showMessage(response.msg);
                } else {
                    window.siyuan.config.sync.enabled = true
                    confirmDialog(window.siyuan.languages.sync, window.siyuan.languages.syncNow, () => {
                        fetchPost("/api/sync/performSync", {});
                    });
                }
            });
        });
    } else {
        if (dialog) {
            dialog.destroy();
        }
        confirmDialog(window.siyuan.languages.sync, window.siyuan.languages.syncNow, () => {
            fetchPost("/api/sync/performSync", {});
        });
    }
}

const setKey = () => {
    const dialog = new Dialog({
        title: window.siyuan.languages.dataRepoKey,
        content: `<div class="b3-dialog__content">
    <div class="ft__on-surface">${window.siyuan.languages.dataRepoKeyTip1}</div>
    <div class="fn__hr"></div>
    <div class="ft__error">${window.siyuan.languages.dataRepoKeyTip2}</div>
    <div class="fn__hr"></div>
    <button class="b3-button b3-button--outline fn__block" id="importKey">
        <svg><use xlink:href="#iconDownload"></use></svg>${window.siyuan.languages.importKey}
    </button>
    <div class="fn__hr"></div>
    <button class="b3-button b3-button--outline fn__block" id="initKey">
        <svg><use xlink:href="#iconLock"></use></svg>${window.siyuan.languages.genKey}
    </button>
    <div class="fn__hr"></div>
    <button class="b3-button b3-button--outline fn__block" id="initKeyByPW">
        <svg><use xlink:href="#iconHand"></use></svg>${window.siyuan.languages.genKeyByPW}
    </button>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button>
</div>`
    });
    dialog.element.querySelector(".b3-button--cancel").addEventListener("click", () => {
        dialog.destroy();
    });
    dialog.element.querySelector("#importKey").addEventListener("click", () => {
        const passwordDialog = new Dialog({
            title: "🔑 " + window.siyuan.languages.key,
            content: `<div class="b3-dialog__content">
    <textarea class="b3-text-field fn__block" placeholder="${window.siyuan.languages.keyPlaceholder}"></textarea>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${window.siyuan.languages.confirm}</button>
</div>`,
            width: isMobile() ? "80vw" : "520px",
        });
        const textAreaElement = passwordDialog.element.querySelector("textarea");
        textAreaElement.focus();
        const btnsElement = passwordDialog.element.querySelectorAll(".b3-button");
        btnsElement[0].addEventListener("click", () => {
            passwordDialog.destroy();
        });
        btnsElement[1].addEventListener("click", () => {
            fetchPost("/api/repo/importRepoKey", {key: textAreaElement.value}, () => {
                setSync(textAreaElement.value, dialog);
                passwordDialog.destroy();
            });
        });
    });
    dialog.element.querySelector("#initKey").addEventListener("click", () => {
        confirmDialog("🔑 " + window.siyuan.languages.genKey, window.siyuan.languages.initRepoKeyTip, () => {
            fetchPost("/api/repo/initRepoKey", {}, (response) => {
                setSync(response.data.key, dialog);
            });
        });
    });
    dialog.element.querySelector("#initKeyByPW").addEventListener("click", () => {
        const initDialog = new Dialog({
            title: "🔑 " + window.siyuan.languages.genKeyByPW,
            content: `<div class="b3-dialog__content">
    <input class="b3-text-field fn__block" placeholder="${window.siyuan.languages.password}">
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${window.siyuan.languages.confirm}</button>
</div>`,
            width: isMobile() ? "80vw" : "520px",
        });
        const inputElement = initDialog.element.querySelector(".b3-text-field") as HTMLInputElement;
        inputElement.focus();
        const btnsElement = initDialog.element.querySelectorAll(".b3-button");
        initDialog.bindInput(inputElement, () => {
            (btnsElement[1] as HTMLButtonElement).click();
        });
        btnsElement[0].addEventListener("click", () => {
            initDialog.destroy();
        });
        btnsElement[1].addEventListener("click", () => {
            if (!inputElement.value) {
                showMessage(window.siyuan.languages._kernel[142]);
                return;
            }
            confirmDialog("🔑 " + window.siyuan.languages.genKeyByPW, window.siyuan.languages.initRepoKeyTip, () => {
                initDialog.destroy();
                fetchPost("/api/repo/InitRepoKeyFromPassphrase", {pass: inputElement.value}, (response) => {
                    setSync(response.data.key, dialog);
                });
            });
        });
    });
}