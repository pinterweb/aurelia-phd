import { bootstrap } from "aurelia-bootstrapper";
import { StageComponent } from "aurelia-testing";
import { PLATFORM, DOM } from "aurelia-pal";
import frameworks from "../frameworks";

type ComponentTester = import("aurelia-testing").ComponentTester;

interface BindOptions {
  bindables: Record<string, any>;
  delegates: Record<string, string>;
  handlers: Record<string, Function>;
}

function bind(
  component: ComponentTester,
  attributes?: string,
  context?: Record<string, any>
): ComponentTester {
  return component
    .inView(`<phd-tags-input ${attributes}}></phd-tags-input>`)
    .boundTo({ ...context });
}

frameworks.forEach(framework => {
  describe("The tags input custom element", () => {
    let component: ComponentTester;

    beforeEach(() => {
      component = StageComponent.withResources([
        PLATFORM.moduleName("elements/phd-tags-input")
      ]);

      component.bootstrap(aurelia => {
        return aurelia.use
          .standardConfiguration()
          .feature(PLATFORM.moduleName("resources"), { framework });
      });
    });

    afterEach(() => component.dispose());

    xit("adjusts the input style on attached", () => {});

    xit("adjusts the input style if the control element changes", () => {});

    it("creates no tags when none are bound", async () => {
      await bind(component).create(bootstrap);

      const $tags = component.element.querySelector(".tags-input__tag");

      expect($tags).toEqual(null);
    });

    describe("when tags are bound", () => {
      beforeEach(async () => {
        await bind(component, `tags.bind="tags"`, {
          tags: ["foo", "bar"]
        }).create(bootstrap);
      });

      it("creates tags when they are bound", async () => {
        const $tags = await component.waitForElements(".tags-input__tag");

        expect($tags.length).toEqual(2);
      });

      // bulma specific
      it("shows the tags text", async () => {
        const $tags = await component.waitForElements(".tags-input__tag");

        expect(Array.from($tags).map(t => t.textContent.trim())).toContain(
          "foo"
        );
      });

      // bulma specific
      it("removes the tags when delete button clicked", async done => {
        const $deleteLink = (await component.waitForElement(
          ".tags-input__tag a"
        )) as HTMLAnchorElement;

        $deleteLink.click();

        setTimeout(() => {
          const $tags = component.element.querySelectorAll(".tags-input__tag");
          expect($tags.length).toEqual(1);
          done();
        });
      });
    });

    ["tag-removed", "tagdelete"].forEach(event => {
      it("emits a tag-removed event on tag removed", async () => {
        let tagRemovedEvent = null;
        await bind(
          component,
          `tags.bind="tags" ${event}.delegate="tagRemoved($event)"`,
          {
            tags: ["foo", "bar"],
            tagRemoved: event => (tagRemovedEvent = event)
          }
        ).create(bootstrap);
        const $deleteLink = (await component.waitForElement(
          ".tags-input__tag a"
        )) as HTMLAnchorElement;

        $deleteLink.click();

        expect(tagRemovedEvent.detail).toEqual({
          index: 0,
          text: "foo",
          value: "foo",
          key: "",
          relatedTags: ["bar"],
          relatedValues: ["bar"]
        });
      });

      xit("prevents default if events are cancelled", async done => {});
    });

    it("emits a tagpush event when a new value is entered", async done => {
      let tagAddedEvent = null;
      await bind(component, `tagpush.delegate="tagAdded($event)"`, {
        tagAdded: event => (tagAddedEvent = event)
      }).create(bootstrap);
      const $input = (await component.waitForElement(
        ".tags-input__input"
      )) as HTMLInputElement;

      $input.value = "foobar";

      $input.dispatchEvent(DOM.createCustomEvent("change", { bubbles: true }));

      setTimeout(() => {
        expect(tagAddedEvent.detail).toEqual({
          index: 0,
          text: "foobar",
          value: "foobar",
          key: "",
          relatedTags: ["foobar"],
          relatedValues: ["foobar"]
        });
        done();
      });
    });

    it("supports a key value pair when entered", async done => {
      let tagAddedEvent = null;
      await bind(component, `tagpush.delegate="tagAdded($event)"`, {
        tagAdded: event => (tagAddedEvent = event)
      }).create(bootstrap);
      const $input = (await component.waitForElement(
        ".tags-input__input"
      )) as HTMLInputElement;

      $input.value = "foo=bar";

      $input.dispatchEvent(DOM.createCustomEvent("change", { bubbles: true }));

      setTimeout(() => {
        expect(tagAddedEvent.detail).toEqual({
          index: 0,
          text: "foo=bar",
          value: "bar",
          key: "foo",
          relatedTags: ["foo=bar"],
          relatedValues: ["bar"]
        });
        done();
      });
    });

    it("does not emit a tagpush event when the new value entered is missing", async done => {
      let tagAddedEvent = null;
      await bind(component, `tagpush.delegate="tagAdded($event)"`, {
        tagAdded: event => (tagAddedEvent = event)
      }).create(bootstrap);
      const $input = (await component.waitForElement(
        ".tags-input__input"
      )) as HTMLInputElement;

      $input.value = "";

      $input.dispatchEvent(DOM.createCustomEvent("change", { bubbles: true }));

      setTimeout(() => {
        expect(tagAddedEvent).toEqual(null);
        done();
      });
    });

    xit("removes the input text on ESC", async done => {});

    xit("does nothing on tab", async done => {});
  });
});
