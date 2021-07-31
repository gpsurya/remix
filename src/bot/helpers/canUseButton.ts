import { Context } from "grammy";
import i18n from "../i18n";

export default async (ctx: Context) => {
  if (ctx.inlineQuery?.from.id == ctx.message?.reply_to_message?.from?.id) {
    return true;
  }

  await ctx.answerCallbackQuery({
    text: i18n("cant_use_button"),
    show_alert: true,
  });
  return false;
};
