"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./BikeOfficialSection.module.css";

const DANDA_PATH = "M 752 905 L 752 992 L 818 992 L 819 981 L 765 980 L 766 953 L 814 953 L 814 942 L 766 942 L 765 918 L 816 917 L 817 906 Z M 565 905 L 564 991 L 577 991 L 577 962 L 591 950 L 623 992 L 639 992 L 601 942 L 638 905 L 621 905 L 578 946 L 577 906 Z M 429 905 L 428 991 L 441 992 L 441 905 Z M 240 905 L 239 991 L 278 992 L 291 990 L 299 986 L 307 973 L 306 957 L 299 949 L 293 946 L 303 933 L 303 923 L 300 916 L 294 910 L 284 906 Z M 252 953 L 276 952 L 286 954 L 293 960 L 293 973 L 284 980 L 253 981 Z M 252 918 L 284 918 L 290 924 L 290 934 L 281 941 L 253 941 Z M 442 668 L 407 829 L 458 829 L 483 714 L 557 714 L 562 718 L 562 728 L 539 829 L 587 829 L 612 712 L 611 694 L 605 681 L 593 672 L 575 668 Z M 249 678 L 236 694 L 229 711 L 205 836 L 255 833 L 266 780 L 345 780 L 346 784 L 336 830 L 384 829 L 408 719 L 408 696 L 401 681 L 391 673 L 371 666 L 319 663 L 279 664 L 263 669 Z M 274 737 L 279 714 L 286 705 L 291 703 L 352 704 L 360 713 L 360 720 L 354 739 Z M 805 676 L 793 666 L 780 662 L 646 667 L 611 829 L 746 833 L 759 830 L 774 822 L 788 808 L 796 795 L 810 755 L 815 709 L 812 690 Z M 764 709 L 769 726 L 767 748 L 758 774 L 747 787 L 739 790 L 666 788 L 684 706 L 754 704 Z M 1010 655 L 1002 648 L 989 643 L 975 642 L 901 650 L 883 656 L 861 671 L 848 688 L 839 711 L 816 836 L 866 838 L 873 794 L 877 782 L 956 784 L 946 844 L 994 848 L 1019 701 L 1019 678 L 1015 663 Z M 970 700 L 970 712 L 965 734 L 885 735 L 890 707 L 900 696 L 961 691 Z M 35 642 L 1 851 L 132 841 L 157 831 L 173 816 L 183 801 L 192 781 L 199 757 L 204 727 L 204 701 L 195 675 L 186 665 L 168 656 Z M 73 695 L 139 698 L 149 701 L 155 707 L 158 718 L 158 738 L 153 762 L 143 783 L 133 792 L 82 795 L 56 794 Z M 507 294 L 445 327 L 445 405 L 502 437 L 509 439 L 572 402 L 572 328 Z M 494 1 L 494 148 L 320 245 L 319 480 L 508 591 L 700 476 L 700 118 Z M 574 104 L 657 152 L 657 452 L 506 539 L 359 453 L 359 279 L 505 195 L 572 232 L 572 123 Z";

const SPECIALIZED_MARK = "M 504 1 L 501 4 L 495 5 L 495 17 L 491 17 L 487 25 L 478 32 L 474 45 L 469 45 L 466 48 L 466 51 L 459 59 L 459 64 L 453 67 L 446 78 L 432 92 L 427 94 L 422 101 L 414 104 L 414 109 L 410 114 L 410 117 L 416 121 L 410 124 L 412 131 L 408 134 L 406 140 L 401 138 L 394 144 L 392 155 L 397 160 L 389 166 L 383 158 L 371 166 L 366 184 L 358 191 L 351 204 L 342 211 L 341 220 L 339 222 L 331 220 L 325 228 L 328 242 L 302 255 L 304 263 L 297 269 L 293 285 L 288 280 L 282 281 L 283 296 L 281 304 L 273 309 L 271 313 L 276 321 L 270 322 L 266 314 L 259 317 L 255 326 L 255 334 L 262 341 L 256 346 L 250 342 L 245 342 L 241 345 L 242 355 L 239 359 L 232 362 L 217 390 L 213 405 L 215 416 L 246 457 L 279 490 L 291 495 L 301 492 L 328 469 L 337 464 L 350 451 L 367 441 L 373 432 L 385 427 L 401 409 L 419 399 L 453 372 L 464 366 L 467 366 L 469 369 L 463 384 L 456 388 L 456 398 L 449 403 L 446 409 L 447 432 L 445 434 L 442 431 L 438 431 L 432 434 L 432 449 L 437 457 L 435 465 L 429 471 L 425 471 L 421 464 L 417 469 L 417 475 L 425 490 L 426 505 L 430 514 L 427 515 L 421 507 L 413 505 L 405 492 L 401 492 L 399 501 L 404 509 L 404 514 L 399 517 L 392 515 L 391 518 L 396 524 L 397 530 L 405 535 L 406 542 L 396 541 L 393 549 L 390 546 L 388 537 L 386 536 L 381 540 L 383 547 L 381 550 L 381 560 L 371 568 L 369 592 L 373 602 L 373 611 L 363 610 L 364 604 L 362 602 L 356 608 L 351 620 L 348 638 L 341 642 L 345 649 L 341 669 L 335 675 L 335 689 L 326 699 L 326 704 L 335 708 L 333 718 L 340 728 L 337 730 L 328 724 L 323 725 L 321 729 L 325 736 L 325 768 L 327 772 L 327 778 L 323 784 L 326 789 L 325 799 L 329 810 L 335 814 L 333 819 L 346 828 L 349 834 L 356 837 L 356 842 L 368 866 L 384 881 L 384 891 L 399 908 L 407 921 L 410 923 L 419 921 L 435 942 L 440 957 L 450 963 L 454 961 L 453 947 L 442 934 L 439 927 L 440 922 L 433 918 L 434 910 L 428 901 L 420 874 L 421 863 L 416 838 L 417 761 L 423 743 L 423 729 L 429 698 L 428 688 L 433 681 L 433 669 L 442 654 L 444 641 L 454 618 L 466 578 L 505 502 L 505 497 L 515 477 L 526 460 L 536 437 L 557 402 L 582 353 L 610 310 L 615 298 L 623 290 L 639 266 L 639 256 L 633 238 L 596 178 L 587 177 L 575 187 L 564 189 L 560 194 L 556 194 L 551 189 L 545 189 L 536 200 L 528 198 L 523 204 L 517 202 L 515 209 L 512 212 L 506 212 L 501 222 L 496 220 L 494 227 L 490 231 L 481 230 L 472 236 L 468 242 L 460 242 L 459 246 L 461 249 L 451 253 L 449 256 L 442 252 L 439 260 L 433 258 L 431 260 L 432 266 L 429 270 L 423 266 L 418 266 L 413 269 L 412 276 L 405 272 L 405 266 L 411 262 L 412 257 L 420 250 L 426 236 L 433 231 L 434 225 L 440 222 L 441 214 L 454 203 L 453 197 L 459 196 L 461 191 L 472 180 L 477 170 L 492 155 L 503 138 L 505 131 L 518 120 L 527 103 L 524 87 L 518 82 L 517 70 L 511 64 L 515 60 L 513 49 L 516 41 L 515 18 L 512 13 L 513 8 Z M 522 208 L 525 210 L 523 211 Z";

const SPECIALIZED_WORD = "M 835 1125 L 835 1142 L 839 1142 L 839 1137 L 843 1136 L 845 1142 L 848 1143 L 849 1127 L 847 1125 Z M 839 1130 L 843 1129 L 844 1131 L 841 1132 Z M 839 1117 L 833 1119 L 828 1124 L 825 1130 L 825 1138 L 831 1147 L 844 1151 L 854 1146 L 859 1132 L 852 1120 Z M 840 1120 L 850 1123 L 854 1127 L 856 1134 L 853 1142 L 844 1148 L 835 1146 L 828 1136 L 829 1128 L 833 1123 Z M 768 1015 L 708 1015 L 699 1021 L 659 1112 L 658 1125 L 661 1128 L 721 1128 L 724 1121 L 723 1118 L 688 1118 L 686 1115 L 704 1076 L 734 1076 L 738 1070 L 737 1066 L 708 1065 L 723 1029 L 729 1024 L 766 1023 L 769 1018 Z M 684 1016 L 619 1015 L 616 1021 L 617 1025 L 654 1025 L 655 1027 L 573 1115 L 569 1122 L 570 1126 L 574 1129 L 642 1129 L 646 1122 L 645 1118 L 604 1118 L 603 1115 L 685 1026 L 686 1019 Z M 607 1015 L 582 1015 L 579 1019 L 535 1121 L 534 1129 L 559 1129 L 605 1024 Z M 538 1015 L 513 1015 L 471 1111 L 469 1124 L 473 1128 L 523 1129 L 525 1127 L 526 1118 L 500 1118 L 498 1113 L 539 1018 Z M 469 1015 L 445 1015 L 435 1023 L 366 1125 L 366 1129 L 389 1129 L 421 1083 L 437 1083 L 439 1085 L 435 1129 L 459 1129 L 461 1127 Z M 441 1054 L 440 1073 L 430 1074 L 431 1068 Z M 403 1015 L 376 1016 L 328 1127 L 329 1129 L 356 1128 Z M 363 1015 L 303 1015 L 292 1022 L 251 1121 L 255 1128 L 316 1129 L 319 1121 L 317 1118 L 282 1118 L 281 1113 L 318 1028 L 324 1024 L 360 1024 L 364 1018 Z M 284 1015 L 225 1015 L 215 1021 L 176 1109 L 173 1119 L 176 1128 L 236 1129 L 240 1121 L 239 1118 L 203 1118 L 202 1114 L 220 1076 L 249 1076 L 254 1067 L 225 1067 L 223 1065 L 238 1030 L 246 1024 L 280 1024 L 285 1017 Z M 197 1019 L 191 1015 L 133 1015 L 83 1128 L 108 1129 L 126 1090 L 165 1085 L 173 1082 L 179 1076 L 199 1030 Z M 168 1024 L 171 1029 L 153 1071 L 146 1077 L 132 1079 L 131 1077 L 155 1024 Z M 120 1016 L 57 1015 L 52 1017 L 43 1031 L 35 1055 L 62 1082 L 62 1088 L 55 1106 L 46 1118 L 7 1118 L 1 1128 L 65 1129 L 71 1126 L 76 1120 L 89 1090 L 89 1079 L 64 1055 L 64 1043 L 71 1029 L 77 1024 L 116 1024 Z M 851 1018 L 844 1014 L 782 1014 L 764 1052 L 733 1128 L 799 1129 L 807 1126 L 813 1120 L 849 1038 L 852 1030 Z M 822 1025 L 824 1028 L 823 1034 L 789 1112 L 782 1118 L 765 1118 L 764 1115 L 804 1025 Z";

function DandaLogo() {
  return (
    <svg viewBox="0 0 1021 993" aria-label="Danda Bike" role="img">
      <path d={DANDA_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

function SpecializedLogo() {
  return (
    <svg viewBox="0 0 862 1154" aria-label="Specialized" role="img">
      <path d={SPECIALIZED_MARK} fill="#ba7049" fillRule="evenodd" />
      <path d={SPECIALIZED_WORD} fill="#f5f0dc" fillRule="evenodd" />
    </svg>
  );
}

export default function BikeOfficialSection() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const faq = document.querySelector<HTMLElement>(".faqSection");
    if (!faq?.parentNode) return;

    let root = document.getElementById("bike-oficial-root");
    const created = !root;

    if (!root) {
      root = document.createElement("div");
      root.id = "bike-oficial-root";
      faq.parentNode.insertBefore(root, faq);
    }

    setTarget(root);

    return () => {
      setTarget(null);
      if (created && root?.parentNode) root.parentNode.removeChild(root);
    };
  }, []);

  if (!target) return null;

  return createPortal(
    <section id="bike-oficial" className={styles.section} aria-labelledby="bike-oficial-title">
      <div className={styles.desktopArtwork}>
        <img
          src="/bike-oficial-danda-specialized.webp"
          alt="Danda Bike e Specialized, parceiros da bike oficial da Legends Bike Race"
        />
        <a
          className={styles.desktopButton}
          href="https://dandabikeshop.com.br/bicicletas/estrada-gravel"
          target="_blank"
          rel="noreferrer"
          aria-label="Conheça a bike oficial no site da Danda Bike"
        />
      </div>

      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Bike oficial</p>
          <h2 id="bike-oficial-title" className={styles.title}>
            Danda Bike +<br />
            <em>Specialized</em>
          </h2>
          <p className={styles.description}>
            Parceiros oficiais da bike oficial da Legends Bike Race. A Specialized Diverge será a bike oficial do evento, em parceria com a Danda Bike.
          </p>

          <div className={styles.logos} aria-label="Danda Bike e Specialized">
            <span className={styles.danda}><DandaLogo /></span>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.specialized}><SpecializedLogo /></span>
          </div>

          <a
            className={styles.button}
            href="https://dandabikeshop.com.br/bicicletas/estrada-gravel"
            target="_blank"
            rel="noreferrer"
          >
            Conheça a bike oficial <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <img
            src="/bike-oficial-danda-specialized.webp"
            alt=""
          />
        </div>
      </div>
    </section>,
    target,
  );
}
