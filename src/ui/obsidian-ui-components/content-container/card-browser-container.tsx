import { ButtonComponent, Platform } from "obsidian";

import { Card } from "src/card/card";
import { IFlashcardReviewSequencer } from "src/card/flashcard-review-sequencer";
import { CardListType, Deck } from "src/deck/deck";
import { t } from "src/lang/helpers";
import ModalCloseButtonComponent from "src/ui/obsidian-ui-components/content-container/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export class CardBrowserContainer {
    public containerEl: HTMLDivElement;
    public isActive: boolean = false;

    private reviewSequencer: IFlashcardReviewSequencer;
    private onCardSelected: (card: Card, deck: Deck) => void;
    private onBack: () => void;
    private closeModal?: () => void;

    constructor(
        containerEl: HTMLDivElement,
        reviewSequencer: IFlashcardReviewSequencer,
        onCardSelected: (card: Card, deck: Deck) => void,
        onBack: () => void,
        closeModal?: () => void,
    ) {
        this.containerEl = containerEl;
        this.reviewSequencer = reviewSequencer;
        this.onCardSelected = onCardSelected;
        this.onBack = onBack;
        this.closeModal = closeModal;

        this.containerEl.addClasses(["sr-container", "sr-card-browser-container", "sr-is-hidden"]);
    }

    show(deck: Deck): void {
        this.containerEl.empty();
        this._buildUI(deck);
        this.containerEl.removeClass("sr-is-hidden");
        this.isActive = true;
    }

    hide(): void {
        this.containerEl.addClass("sr-is-hidden");
        this.isActive = false;
    }

    close(): void {
        this.hide();
    }

    private _buildUI(deck: Deck): void {
        // Header
        const header = this.containerEl.createDiv("sr-header");
        const titleWrapper = header.createDiv("sr-title-wrapper");

        new ButtonComponent(titleWrapper)
            .setIcon("arrow-left")
            .setClass("clickable-icon")
            .setTooltip(t("BACK"))
            .onClick(() => this.onBack());

        titleWrapper.createDiv("sr-flex-spacer");
        titleWrapper.createDiv("sr-title").setText(deck.deckName);
        titleWrapper.createDiv("sr-flex-spacer");

        new ModalCloseButtonComponent(
            titleWrapper,
            () => this.closeModal && this.closeModal(),
            [
                !this.closeModal && "sr-hide-by-scaling",
                !this.closeModal && "hide-height",
                EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "clickable-icon",
                "sr-modal-close-button",
            ],
        );

        this.containerEl.createEl("hr");

        // Card list
        const scrollWrapper = this.containerEl.createDiv("sr-scroll-wrapper");
        const cardList = scrollWrapper.createDiv("sr-card-browser-list");

        const topicPath = deck.getTopicPath();
        const originalDeck = this.reviewSequencer.originalDeckTree.getDeck(topicPath);
        const remainingDeck = this.reviewSequencer.remainingDeckTree.getDeck(topicPath);

        const remainingCards = new Set<Card>(
            remainingDeck.getFlattenedCardArray(CardListType.All, true),
        );

        const allCards = originalDeck.getFlattenedCardArray(CardListType.All, true);
        const seen = new Set<Card>();

        for (const card of allCards) {
            if (seen.has(card)) continue;
            seen.add(card);
            this._createCardItem(cardList, card, deck, remainingCards.has(card));
        }

        if (seen.size === 0) {
            const empty = cardList.createDiv("sr-card-browser-empty");
            empty.setText("No cards in this deck.");
        }
    }

    private _createCardItem(
        container: HTMLElement,
        card: Card,
        deck: Deck,
        inQueue: boolean,
    ): void {
        const item = container.createDiv("sr-card-browser-item");

        if (inQueue) {
            item.addClass("sr-card-browser-item-active");
            item.addEventListener("click", () => this.onCardSelected(card, deck));
        } else {
            item.addClass("sr-card-browser-item-done");
        }

        const frontEl = item.createDiv("sr-card-browser-item-front");
        frontEl.setText(card.front);

        const badge = item.createDiv("sr-card-browser-item-badge");
        if (!inQueue) {
            badge.setText("Done");
            badge.addClass("sr-card-browser-badge-done");
        } else if (card.isNew) {
            badge.setText("New");
            badge.addClass("sr-card-browser-badge-new");
        } else {
            badge.setText("Due");
            badge.addClass("sr-card-browser-badge-due");
        }
    }
}
