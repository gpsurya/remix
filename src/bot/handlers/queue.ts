import { Composer, Api, InlineKeyboard } from "grammy";
import { Message } from "@grammyjs/types";
import { escape } from "html-escaper";

import gramtgcalls from "../../userbot/gramtgcalls";
import queues from "../../queues";
import { Item } from "../../queues";
import canUseButton from "../helpers/canUseButton";
import i18n from "../i18n";

const composer = new Composer();

export default composer;

function splitItems(items: Item[]) {
  var toReturn = [];

  for (var i = 0; i < items.length; i += 10) {
    toReturn.push(items.slice(i, i + 10));
  }

  return toReturn;
}

const listItems = (items: Item[], index: number) => {
  const chunks = splitItems(items);
  const chunk = chunks[index] || chunks[0] || [];
  let toReturn = `Page ${chunks[index] ? index + 1 : 1}.\n\n`;

  for (let i in chunk) {
    const item = chunk[i];

    toReturn += `— <a href="${item.url}">${escape(
      item.title
    )}</> by <a href="tg://user?id=${item.requester.id}">${escape(
      item.requester.first_name
    )}</>\n`;
  }

  return toReturn;
};

const updateMessage = async (message: Message, index = 0, api: Api) => {
  const queue = queues.getAll(message.chat.id);

  if (queue) {
    api.editMessageText(
      message.chat.id,
      message.message_id,
      listItems(queue, index),
      {
        reply_markup: new InlineKeyboard()
          .text("➡️", "page")
          .row()
          .text("⏯", "pause")
          .text("⏩", "skip")
          .row()
          .text("🔀", "shuffle")
          .text("🔄", "refresh"),
        disable_web_page_preview: true,
      }
    );
  }
};

const getIndex = (message: Message) =>
  Number(message.text?.split(/\s/)[0].split(/\s/).slice(0, -1)) - 1;

composer.command(["queue", "q", "list", "ls"], async (ctx) => {
  await updateMessage(
    await ctx.reply(i18n("please_wait"), {
      reply_to_message_id: ctx.message?.message_id,
    }),
    0,
    ctx.api
  );
});

composer.callbackQuery("pause", async (ctx) => {
  if (!(await canUseButton(ctx)) || !ctx.chat) {
    return;
  }

  const paused = gramtgcalls.pause(ctx.chat.id);

  if (paused) {
    await ctx.answerCallbackQuery({
      text: "⏸ Paused",
      show_alert: true,
    });
    return;
  } else if (paused == null) {
    await ctx.answerCallbackQuery({
      text: "❌ Not in call",
      show_alert: true,
    });
    return;
  }

  gramtgcalls.resume(ctx.chat.id);
  await ctx.answerCallbackQuery({
    text: "▶️ Resumed",
    show_alert: true,
  });
});

composer.callbackQuery("refresh", async (ctx) => {
  if (!(await canUseButton(ctx)) || !ctx.message) {
    return;
  }

  await updateMessage(ctx.message, getIndex(ctx.message), ctx.api);
});

composer.command("page", async (ctx) => {
  if (!(await canUseButton(ctx)) || !ctx.message) {
    return;
  }

  await updateMessage(ctx.message, getIndex(ctx.message) + 1, ctx.api);
});
