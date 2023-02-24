import { Vue, Component, Prop, Watch, Lifecycle } from "av-ts";
import { VNodeDirective, VNode } from "vue";
import * as clipboardJs from "clipboard";

Vue.directive("bs-tooltip", {
    inserted: (el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode) => {
        const options = binding.value as any || {};

        if(options.delay === undefined) {
          options.delay = 300;
        }

        $(el).tooltip(options);
    },

    update: (el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode) => {
        if (binding.value !== binding.oldValue) {
            const options = binding.value as any;
            $(el).tooltip("dispose" as any);
            $(el).tooltip(options);
        }
    },

    unbind: (el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode) => {
        $(el).tooltip("dispose" as any);
    },
});

Vue.directive("custom-validity", {
    update: (el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode) => {
        if (binding.value !== binding.oldValue) {
            let isValid: boolean;
            let error: string;

            if (typeof binding.value === "object") {
                isValid = (binding.value as any).isValid;
                error = (binding.value as any).error;
            } else {
                isValid = !!binding.value;
                error = vnode.context.$i18n.t("common.validationError").toString();
            }

            if (el.tagName.toLowerCase() === "input") {
                const inputEl = el as HTMLInputElement;
                inputEl.setCustomValidity(!isValid ? error : "");
            } else if (el.tagName.toLowerCase() === "button") {
                const buttonEl = el as HTMLButtonElement;
                buttonEl.setCustomValidity(!isValid ? error : "");
            } else if (el.tagName.toLowerCase() === "select") {
                const selectEl = el as HTMLSelectElement;
                selectEl.setCustomValidity(!isValid ? error : "");
            } else if (el.tagName.toLowerCase() === "textarea") {
                const taEl = el as HTMLTextAreaElement;
                taEl.setCustomValidity(!isValid ? error : "");
            }
        }
    },
});

Vue.directive("autofocus", {
    inserted: (el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode) => {
        el.focus();
    },
});

declare var ClipboardJS: any;

Vue.directive("clipboard", {
  inserted: (el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode) => {
    const options = binding.value as any;

    new clipboardJs(el, {
      target: ()=> document.querySelector(options.target)
    });
  }
});
